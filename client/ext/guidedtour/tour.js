this.tour = {
    initialText: "This guided tour introduces you to some of the ways<br/> Cloud9 IDE makes it easy for you to program faster and smarter.\n\nClick the play button below to be taken on the tour automatically. Or, you can click the forward and backward buttons to navigate on your own. Remember that during the tour, you won't be able to interact with any of the editor's features.",
    finalText: "Well, that's everything! Still have questions? Head on over to <a href=\"http://support.cloud9ide.com/forums\" target=\"_blank\">our documentation site</a>.",
    steps: [
    {
        before: function() {
            require("ext/sidebar/sidebar").showOrHide(true);
        },
        el: undefined,
        div: "navbar",
        desc: "This is the project bar. It controls the behavior of the IDE, as well as the presentation of your code.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            // require("ext/tree/tree").enable();
        },
        el: undefined,
        div: "navbar.childNodes[0]",
        desc: "This button shows and hides your project files.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/openfiles/openfiles").enable();
        },
        el: undefined,
        div: "navbar.childNodes[1]",
        desc: "This button shows and hides your open files in a list view.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/settings/settings").enable();
        },
        el: undefined,
        div: "navbar.childNodes[navbar.childNodes.length - 1]",
        desc: "Here, you can change the behavior of the editor, manipulate the code beautifier, and change the indentation and width of the editor, among other options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: "winFilesViewer",
        desc: "All your project files are listed here. You can rename and delete files, as well as drag in new ones from your computer. You can also right-click to see context options.",
        pos: "right",
        time: 4
    }, {
        before: function() {
            //require("ext/tree/tree").enable();
        },
        el: plus_tab_button,
        desc: "You can use this button to quickly add new files to the editor. We'll simulate pushing that right now.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            if (madeNewFile == false) {
                madeNewFile = true;
                require("ext/newresource/newresource").newfile();
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabEditors.$ext),
        desc: "Here's a tabbed arrangement of all your active files, including the new one we just created. You can rearrange the tabs however you like and swap through them with keyboard shortcuts.",
        pos: "bottom",
        time: 4
    }, {
        before: function() {
            tabEditors.getPage().$doc.setValue(helloWorldScript);
            if (!save) 
                save = require("ext/save/save");
            var page = tabEditors.getPage();
            var file = page.$model.data;
            save._saveAsNoUI(page, file.getAttribute("path"), ide.davPrefix + "/helloWorld-quideTour.js");
            require("ext/tree/tree").refresh();
        },
        el: undefined,
        div: "ceEditor",
        desc: "We've just typed up a quick code example and saved it as \"helloWorld-quideTour.js.\" We'll work with this file, then delete it when we're done.",
        pos: "left",
        time: 5
    }, {
        before: function(){
            if (wentToZen){
                zen.fadeZenButtonOut();
                wentToZen = false;
            }
        },
        el: undefined,
        div: "DIV[1]",
        desc: "The gutter can do more than show line numbers. It also detects and displays warnings and errors in your code. If you're debugging an application, you can also set breakpoints here.",
        pos: "right",
        time: 5
    }, {
        before: function() {

        },
        el: undefined,
        div: "barIdeStatus",
        desc: "This is the status bar. It shows your current line number and column position. Clicking on it lets you modify IDE aspects, like vim mode, line margins, and scroll speed.",
        pos: "left",
        time: 4
    }, {
        before: function(){
            wentToZen = true;
            zen.fadeZenButtonIn();
        },
        el: undefined,
        div: undefined,
        desc: "If you hover over this corner, you can activate Zen Mode, which is a distraction-free environment. We'll simulate pressing that button now.",
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
        div: "DIV[1]",
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
        desc: "Here's where the fun begins! After clicking Debug, then Run Configurations, you'll be able to create or modify a debug configuration. Every configuration needs a name and a file to run, but you can also pass arguments.",
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
        desc: "Next, when you start debugging, you'll instantly get a new debugging toolbar.",
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
        desc: "We indicated to the debugger that we want to continue. At last, the console.log() message printed out. Now, we're going to simulate typing 'git status' in the command line.",
        pos: "top",
        time: 4
    }, {
        before: function(){
            require(["c9/ext/deploy/deploy"], function(deploy) { 
                hasDeploy = true;
                panels.activate(deploy);
            });
        },
        el: "winDeploy",
        desc: "In this panel you can manage(add/remove) your deploy targets for your application, in different services, like Joyent and Heroku.",
        pos: "right",
        notAvailable: !hasDeploy,
        time: 5
    }, {
        before: function() {
            require('ext/runpanel/runpanel').stop();
            
            if(trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']")) {
                require("ext/console/console").commandTextHandler({
                    keyCode: 13,
                    currentTarget: txtConsoleInput
                });
                txtConsoleInput.setValue("rm helloWorld-quideTour.js");
            }
        },
        el: (apf.XPath || apf.runXpath() || apf.XPath).selectNodes('DIV[1]', tabConsole.$ext),
        desc: "As expected, there's been a new file added to git. We're done testing it, and don't want to keep it around, so let's remove it with 'rm helloWorld-quideTour.js'.",
        pos: "top",
        time: 4
    }, {
        before: function() {
            panels.activate(require("ext/tree/tree"));
            var demoFile = trFiles.$model.queryNode("//file[@path='" + ide.davPrefix + "/helloWorld-quideTour.js']");
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