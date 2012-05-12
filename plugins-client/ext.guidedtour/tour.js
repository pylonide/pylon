this.tour = {
    initialText: "This guided tour introduces you to some of the ways<br/> Cloud9 IDE makes it easy for you to program faster and smarter.\n\nClick the play button below to be taken on the tour automatically. Or, you can click the forward and backward buttons to navigate on your own. Remember that during the tour, you won't be able to interact with any of the editor's features.",
    finalText: "Well, that's everything! Still have questions? Head on over to <a href=\"http://support.cloud9ide.com/forums\" target=\"_blank\">our documentation site</a>.",
    steps: [
    {
        before: function() {
            
        },
        el: undefined,
        div: "navbar",
        desc: "This is the project bar. These buttons control the behavior of the IDE, as well as the presentation of your code.",
        pos: "bottom",
        time: 4
    }, {
        before: function() {
            
        },
        el: undefined,
        div: "navbar.childNodes[1]",
        desc: "This button shows and hides your project files.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            require("ext/panels/panels").activate(require("ext/openfiles/openfiles"));
        },
        el: undefined,
        div: "navbar.childNodes[2]",
        desc: "This button shows and hides your open files in a list view.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            require("ext/settings/settings").show();
        },
        el: undefined,
        div: "navbar.childNodes[navbar.childNodes.length - 2]",
        desc: "Here, you can enable additional features and change the behavior of the editor.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            require("ext/panels/panels").activate(require("ext/tree/tree"));
        },
        el: "winFilesViewer",
        desc: "While viewing your project files, you can rename and delete files, as well as drag in new ones from your computer. You can also right-click to see context options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            if (madeNewFile) {
                madeNewFile = false;
                require("ext/tabbehaviors/tabbehaviors").closetab(tabEditors.getPage());
            }
        },
        el: plus_tab_button,
        desc: "Use this button to quickly add new files to the editor. We'll push it right now.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            if (madeNewFile == false) {
                madeNewFile = true;
                require("ext/newresource/newresource").newfile();
            }
            settings.model.setQueryValue("editors/code/@gutter", true); // has to be here to force show when new editor opens
            settings.model.setQueryValue("auto/statusbar/@show", true);
            require("ext/statusbar/statusbar").preinit();
        },
        el: tabEditors.$buttons,
        desc: "Rearrange these tabs any way you like, and cycle through them with keyboard shortcuts.",
        extra: 160,
        pos: "bottom",
        time: 4
    }, {
        before: function() {
            tabEditors.getPage().$doc.setValue(helloWorldScript);
            if (!save) 
                save = require("ext/save/save");
            var page = tabEditors.getPage();
            var file = page.$model.data;
            save._saveAsNoUI(page, file.getAttribute("path"), ide.davPrefix + "/helloWorld-guidedTour.js");
            require("ext/tree/tree").refresh();
        },
        el: undefined,
        div: "ceEditor",
        desc: "Here's a quick Node.js example, saved as \"helloWorld-guidedTour.js.\"",
        extra: -40,
        pos: "left",
        time: 4
    }, {
        before: function(){
            if (wentToZen){
                zen.fadeZenButtonOut();
                wentToZen = false;
            }
        },
        el: undefined,
        div: "ceEditorGutter",
        desc: "The gutter can do more than show line numbers. It also detects and displays warnings and errors in your code. If you're debugging an application, you can also set breakpoints here.",
        extra: 15,
        pos: "right",
        time: 5
    }, {
        before: function() {

        },
        el: undefined,
        div: "barIdeStatus",
        desc: "The status bar shows your cursor position. Clicking on it modifies some of the IDE aspects.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            wentToZen = true;
            zen.fadeZenButtonIn();
        },
        el: undefined,
        div: undefined,
        desc: "If you hover over this corner, you can activate Zen Mode, which is a distraction-free environment. We'll press that button now.",
        pos: "left",
        time: 5
    }, {
        before: function() {
            var hlElement = require("ext/guidedtour/guidedtour").hlElement;
            hlElement.style.visibility = "hidden";
            winTourText.hide();
            document.getElementsByClassName("tgDialog")[0].style.display = "none";
            zen.fadeZenButtonOut();
            zen.enterIntoZenMode();
            
            setTimeout(function(){
                zen.escapeFromZenMode();
                document.getElementsByClassName("tgDialog")[0].style.display = "";
                require("ext/guidedtour/guidedtour").stepForward();
                zen.fadeZenButtonOut();
                                
                hlElement.style.visibility = "visible";
                winTourText.show();
            }, 2000);
        },
        time: 4,
        desc: "",
        skip: true
    }, {
        before: function(){
            require("ext/console/console").showInput();
        },
        el: cliBox,
        desc: "This area down here acts just like a command line for your project in the Cloud9 IDE. You can always type 'help' to get a list of the available commands.",
        pos: "top",
        time: 5
    }, {
        before: function() {
            //ideConsole.enable();
            ideConsole.show();
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "After clicking the expand arrows, you'll be able to get to the full console view. Any output from your program&mdash;like console.log() messages or compilation errors&mdash;appears in the Output tab.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            //winRunCfgNew.hide();
            //ideConsole.disable();
            var doc = require("ext/editors/editors").currentEditor.ceEditor.getSession();
            doc.setBreakpoints([1]);
        },
        el: undefined,
        div: "ceEditorGutter",
        extra: 150,
        desc: "We're ready to test our code, so we've inserted a breakpoint on this line by clicking in the gutter. Before debugging, though, we'll need to set up a debugging scenario.",
        pos: "right",
        time: 5
    }, {
        before: function(){
            panels.activate(require("ext/runpanel/runpanel"));
            if (!madeDebug) {
                settings.model.setQueryValue('auto/configurations/@debug', true);
            }
            setTimeout(function(){
                lstRunCfg.select(lstRunCfg.$model.queryNode("//config"), null, null, null, true)
            });
        },
        el: "winRunPanel",
        desc: "Here's where the fun begins! After clicking Debug, then Run Configurations, you'll be able to create or modify a debug configuration. Every configuration needs a name and a file to run, but you can also pass command-line arguments.",
        pos: "right",
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').run(true);
            var bar = dockpanel.layout.$getLastBar();
            if(!bar) {
                dockpanel.showBar(dockpanel.getBars("ext/debugger/debugger", "pgDebugNav")[0]);
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "Whoa! A lot of things just happened. First off, the Output tab opened up to show us that our code is running, and currently being debugged.",
        pos: "top",
        time: 4
    }, {
        before: function() {
        },
        el: function(){
            return dockpanel.layout.$getLastBar();;
        },
        desc: "Next, whenever you're debugging code, you get a new debugging toolbar.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "pgDebugNav")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                if(!pgDebugNav.parentNode.parentNode.visible)
                    btnRunCommands.dispatchEvent("mousedown",  {});
            }
        },
        el: function(){
            return pgDebugNav;
        },
        desc: "In this toolbar, the usual start, stop, and step buttons are at the top, to help control the flow of the debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgVariable")[0];
            if(menuId) {
                dockpanel.layout.showMenu(menuId.uniqueId);
                dbgVariable.parentNode.set(dbgVariable)
            }
        },
        el: function(){
            return dbgVariable;
        },
        desc: "In this section you can view variables in the debug state.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            var menuId = dockpanel.getButtons("ext/debugger/debugger", "dbgCallStack")[0];
            if(menuId)
                dockpanel.layout.showMenu(menuId.uniqueId);
            dbgCallStack.parentNode.set(dbgCallStack)
        },
        el: function(){
            return dbgCallStack;
        },
        desc: "Here you can see the call stack of the program you are debugging.",
        pos: "left",
        time: 4
    }, {
        before: function() {
            
            dbgCallStack && dbgCallStack.parentNode && dbgCallStack.parentNode.parentNode.hide();
            dbg.continueScript();
            txtConsoleInput.setValue("git status");
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "We indicated to the debugger that we want to continue. At last, the console.log() message about the server running printed out. Now, we're going to simulate typing 'git status' in the command line.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            require('ext/runpanel/runpanel').stop();
            
            if(trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-guidedTour.js']")) {
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                txtConsoleInput.setValue("rm helloWorld-guidedTour.js");
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "As expected, there's our new file being tracked by git. We're done testing it, and don't want to keep it around, so let's remove it with 'rm helloWorld-guidedTour.js'.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            panels.activate(require("ext/tree/tree"));
            var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-guidedTour.js']");
            if(demoFile && !deletedFile) {
                deletedFile = true;
                tabEditors.remove(tabEditors.getPage());
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                trFiles.confirmed = true;
                trFiles.remove(demoFile);
                trFiles.confirmed = false;
                require("ext/tree/tree").refresh();
            }
        },
        el: "winFilesViewer",
        desc: "Voila! Notice that the file is gone from your project.",
        pos: "right",
        time: 4
    }]
}
