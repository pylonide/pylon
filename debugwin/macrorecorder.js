var o3_mouseTranslate = (apf.isIE) 
    ? [3,4] 
    : (apf.isGecko || apf.isChrome)
        ? [1, 2]
        : [0, 0];

var macroList = [];
var curMacroIdx = 0;
var curPlaylistIdx = 0;
var playQueue = [];
var speed = "realtime";

var $o3 = o3.create("8A66ECAC-63FD-4AFA-9D42-3034D18C88F4", { 
    // o3 browser extension not found
    oninstallprompt : function(){
        winNoextension.setProperty("visible", true);
        if (apf.isIE) {
            apf.console.error("o3 not installed");
            lblIE.setProperty("visible", true);
            lblNoIE.setProperty("visible", false);
        }
        else {
            apf.console.error("o3 not available for this browser. Use IE instead.");
            lblNoIE.setProperty("visible", true);
            lblIE.setProperty("visible", false);
        }
    },
    product : 'O3Demo'
});

apf.$debugwin.apf.uirecorder.$o3 = $o3;

// WinXp save folder: C:\Documents and Settings\Admin\Local Settings\Temp\Low\o3_v0_9\localhost
if ($o3) {
    (function loadData() {
        if ($o3.fs.get("macros.xml").exists)
            loadMacros(apf.getXml($o3.fs.get("macros.xml").data) || apf.getXml("<data/>"));
        else
            loadMacros(mdlMacro.getXml());

        if ($o3.fs.get("playlists.xml").exists)
            loadPlaylists(apf.getXml($o3.fs.get("playlists.xml").data) || apf.getXml("<data/>"));
        else
            loadPlaylists(mdlPlaylist.getXml());
    })();
}
else {
    loadMacros(mdlMacro.getXml());
    loadPlaylists(mdlPlaylist.getXml());
}

// check for changes in macro/playlist models
mdlMacro.addEventListener("update", updateMacros);
mdlPlaylist.addEventListener("update", updatePlaylists);

function addPlaylist(numItems) {
    var playlist = mdlPlaylist.data.ownerDocument.createElement("playlist");
    var playlistIdx = 1;
    
    if (numItems > 0) {
        if (mdlPlaylist.data.childNodes.length && mdlPlaylist.data.lastChild.getAttribute("caption") == "playlist" + mdlPlaylist.data.childNodes.length)
            playlistIdx = mdlPlaylist.data.childNodes.length;

        var playlistCaptions = mdlPlaylist.queryNodes("playlist[contains(@caption, 'playlist')]");
        for (var ci = 0, cl = playlistCaptions.length; ci < cl; ci++) {
            var caption = playlistCaptions[ci].getAttribute("caption");
            if (caption.substr(0, 8) != "playlist") continue;
            
            if (parseInt(caption.substr(8)) > playlistIdx)
                playlistIdx = parseInt(caption.substr(8));
        }
        playlistIdx++;
        //if (!playlistIdx) debugger;
    }
    
    
    playlist.setAttribute("id", "p" + playlistIdx);
    playlist.setAttribute("caption", "playlist" + playlistIdx);
    mdlPlaylist.appendXml(playlist);
}


function loadMacros(xml) {
    var macros = xml.selectNodes("test[not(@id)]");
    for (var macroId = 0, mi = 0, ml = macros.length; mi < ml; mi++) {
        while (xml.selectSingleNode("test[@id='m" + macroId + "']")) {
            macroId++;
        }
        macros[mi].setAttribute("id", "m" + macroId);
    }

    mdlMacro.load(xml);
    
    // if id's added save changes
    if (macros.length)
        saveMacros()
}

function loadPlaylists(xml) {
    var playlists = xml.selectNodes("playlist");
    if (playlists.length) {
        for (var macros, pi = 0, pl = playlists.length; pi < pl; pi++) {
            macros = playlists[pi].selectNodes("test[@ref]");
            if (macros.length) {
                for (var errorNodes = [], refNode, mi = 0, ml = macros.length; mi < ml; mi++) {
                    // replace node with reference with original macro
                    if (!mdlMacro.queryNode("test[@id='" + macros[mi].getAttribute("ref") + "']")) {
                        macros[mi].setAttribute("name", "macro not found");
                        errorNodes.push(macros[mi]);
                    }
                    else { 
                        refNode = mdlMacro.queryNode("test[@id='" + macros[mi].getAttribute("ref") + "']");
                        apf.xmldb.replaceNode(apf.getCleanCopy(refNode), macros[mi]);
                    }
                }
            }
        }
        mdlPlaylist.load(xml);
    }
    else {
        addPlaylist();
        savePlaylists();
    }
}

function updateMacros(e) {
    saveMacros();
};

function saveMacros() {
    if ($o3.fs.get("macros.xml").data != mdlMacro.getXml().xml) {
        $o3.fs.get("macros.xml").data = mdlMacro.getXml().xml;
    }
}

function updatePlaylists(e) {
    if (e.action != "add" && e.action != "remove") {
        savePlaylists();
        return;
    }
    
    // if no playlist, last playlist has children or removing last empty playlist, add new playlist
    var numItems = (e.action == "remove") 
        ? mdlPlaylist.data.childNodes.length-1 
        : mdlPlaylist.data.childNodes.length+1 
        
    if (numItems == 0 || mdlPlaylist.data.lastChild.childNodes.length || e.action == "remove" && e.xmlNode == mdlPlaylist.data.lastChild) {
        mdlPlaylist.removeEventListener("update", updatePlaylists);
        addPlaylist(numItems);
        mdlPlaylist.addEventListener("update", updatePlaylists);
    }
    
    savePlaylists();
};

function savePlaylists() {
    var outputXml = mdlPlaylist.getXml();
    var playlists = outputXml.selectNodes("playlist");
    for (var macros, pi = 0, pl = playlists.length; pi < pl; pi++) {
        macros = playlists[pi].selectNodes("test[not(@ref)]");
        if (macros.length) {
            for (var refNode, mi = 0, ml = macros.length; mi < ml; mi++) {
                // replace entire node with node with reference
                refNode = outputXml.ownerDocument.createElement("test");
                refNode.setAttribute("ref", macros[mi].getAttribute("id"))
                apf.xmldb.replaceNode(refNode, macros[mi]);
            }
        }
    }
    if ($o3.fs.get("playlists.xml").data != outputXml.xml)
        $o3.fs.get("playlists.xml").data = outputXml.xml;
}

function recordMacro() {
    btnRec.setProperty("visible", false);
    btnStopRecord.setProperty("visible", true);
    btnPlay.setProperty("disabled", true);
    
    // IE
    //debugger;
    if (document.parentWindow)
        apf.$debugwin.apf.uirecorder.capture.record(document.parentWindow.frameElement.parentElement.document.location.href, "macro" + (mdlMacro.data.childNodes.length+1));
    
    // FF
    else if (window.parent) {
        apf.$debugwin.apf.uirecorder.capture.record(window.parent.location.href, "macro" + (mdlMacro.data.childNodes.length+1));
    }
}

function stopRecord() {
    apf.$debugwin.apf.uirecorder.capture.stop();
    btnStopRecord.setProperty("visible", false);
    btnRec.setProperty("visible", true);
    btnRec.setProperty("disabled", false);
    btnPlay.setProperty("disabled", false);
    var macroId = 0;

    while (mdlMacro.getXml().selectSingleNode("test[@id='m" + macroId + "']")) {
        macroId++;
    }
    
    apf.$debugwin.apf.uirecorder.capture.outputXml.setAttribute("id", "m" + macroId);
    mdlMacro.appendXml(apf.$debugwin.apf.uirecorder.capture.outputXml);

    lstMacro.select(mdlMacro.data.lastChild);
    lstMacro.startRename();
}

function stopPlay() {
    btnStopRecord.setProperty("visible", false);
    btnPlay.setProperty("visible", true);
    btnRec.setProperty("disabled", false);
}

function playSingleMacro(e) {
    // set buttons state
    btnPlay.setProperty("visible", false);
    btnStopPlay.setProperty("visible", true);
    btnRec.setProperty("disabled", true);

    apf.$debugwin.apf.addEventListener("testcomplete", onPlaybackComplete);
    apf.$debugwin.apf.addEventListener("testerror", onTestFailed);

    // play selected macro
//speed = (cbMax.checked) ? "max" : "realtime";
    apf.$debugwin.apf.uirecorder.playback.play(lstMacro.selected, speed, $o3, {top: o3_mouseTranslate[1], left:  o3_mouseTranslate[0]}, false);
}

function playMacro() {
    apf.$debugwin.apf.addEventListener("testcomplete", onPlayNextMacro);
    apf.$debugwin.apf.addEventListener("testerror", onTestFailed);

    // select current playing macro
    apf.setStyleClass(apf.xmldb.getHtmlNode(macroList[curMacroIdx], trPlaylist), "playing");
    apf.$debugwin.apf.uirecorder.playback.play(macroList[curMacroIdx], speed, $o3, {top: o3_mouseTranslate[1], left:  o3_mouseTranslate[0]}, false);
}

function onPlaybackComplete(e) {
    apf.$debugwin.apf.removeEventListener("testcomplete", onPlaybackComplete);
    apf.$debugwin.apf.removeEventListener("testcomplete", onPlayNextMacro);
    apf.$debugwin.apf.removeEventListener("testerror", onTestFailed);

    btnStopPlay.setProperty("visible", false);
    btnRec.setProperty("disabled", false);
    btnPlay.setProperty("visible", true);
    
    // reset classes for macros
    resetMacroStyles();
}

// reset classes for macros
function resetMacroStyles() {
    // reset classes for macros
    for (var i = 0, l = macroList.length; i < l; i++) {
        apf.setStyleClass(apf.xmldb.getHtmlNode(macroList[i], trPlaylist), "", ["playing", "finished"]);
    }
}

function onPlayNextMacro(e) {
    apf.setStyleClass(apf.xmldb.getHtmlNode(macroList[curMacroIdx], trPlaylist), "finished", ["playing"]);
    // check for more macro's to be played
    if (curMacroIdx + 1 < macroList.length) {
        curMacroIdx++;
        // short delay before playing next macro
        setTimeout(playMacro, 100);
    }
    
    // all macro's played, start next playlist or end test
    else {
        if (playQueue[curPlaylistIdx+1]) {
            curPlaylistIdx++;
            resetMacroStyles();
            playPlaylist(playQueue[curPlaylistIdx]);
        }
        else {
            //$o3.DOM.onkeydown = null;
            document.documentElement.onkeydown = null;
            onPlaybackComplete(e);
            trPlaylist.select(trPlaylist.selected);
        }
    }
}

function onTestFailed(e) {
    onPlaybackComplete(e);
}

function playPlaylist(id) {
    //if (!id) debugger;
    //var xml = apf.xmldb.getElementById(id); 
    var xml = mdlPlaylist.data.selectSingleNode("playlist[@id='" + id + "']");
    //if (!xml) debugger;
    trPlaylist.select(xml);
    if (!trPlaylist.selected) {
        alert("no playlist selected"); 
        return;
    }
    
    macroList = (trPlaylist.selected.nodeName == "playlist") 
        ? trPlaylist.selected.selectNodes("test")
        : trPlaylist.selected.parentNode.selectNodes("test");
    if (!macroList.length) {
        alert("no macros to play");
        return;
    }
    curMacroIdx = 0;
//speed = (cbMax.checked) ? "max" : "realtime";
    //$o3.DOM.onkeydown = onKeyDown;
    document.documentElement.onkeydown = onKeyDown;
    playMacro();
}

function playCheckedPlaylists() {
    curPlaylistIdx = 0;
    var playlists = mdlPlaylist.data.selectNodes("playlist");
    playQueue = [];
    for (var id, i = 0, l = playlists.length; i < l; i++) {
        id = playlists[i].getAttribute("id");
        if (eval("cb" + id).checked) {
            playQueue.push(id);
        }
    }
    
    if (playQueue.length)
        playPlaylist(playQueue[curPlaylistIdx]);
}

function onKeyDown(e) {
    // Esc key
    if (e.keyCode == 27) {
        //$o3.DOM.onkeydown = null;
        document.documentElement.onkeydown = onKeyDown;
        apf.$debugwin.apf.uirecorder.playback.stop();
        // mouseup and keyup to prevent dragging if last action was mousedown
        $o3.mouseLeftUp();
        onPlaybackComplete();
        apf.$debugwin.apf.console.error("playback aborted");
        
    }
}

function removeMacroFromPlaylist() {
    // look for references in mdlPlaylist on delete macro
    var id = atPlaylist.$undostack[atPlaylist.$undostack.length-1].args[0].xmlNode.getAttribute("id")

    atPlaylist.begin(mdlPlaylist);
    var playlists = mdlPlaylist.data.childNodes;
    for (var pi = 0, pl = playlists.length; pi < pl; pi++) {
        var nodes = playlists[pi].selectNodes("test[@id='" + id + "']");
        for (var ni = 0, nl = nodes.length; ni < nl; ni++) {
            apf.xmldb.removeNode(nodes[ni]);
        }
    }
    atPlaylist.commit(mdlPlaylist);
    savePlaylists();

    updateMacros();
}

//var recordings = apf.storage.get("recordings", location.href.split("#")[0]);
//mdlMacro.load(recordings || "<recordings />");
