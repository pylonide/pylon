/**
 * Issues Manager for the Cloud9 IDE client
 * 
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ext = require("core/ext");
var ide = require("core/ide");
var util = require("core/util");
var panels = require("ext/panels/panels");
var markup = require("text!ext/issuesmgr/issuesmgr.xml");
var skin = require("text!ext/issuesmgr/skin.xml");

module.exports = ext.register("ext/issuesmgr/issuesmgr", {
    name     : "Issues Manager",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    skin     : skin,
    markup   : markup,
    appendedColumn : false,

    nodes : [],

    init : function(){
        this.panel = winIssuesMgr;

        var _self = this;
        lstIssues.addEventListener("click", function() {
            _self.openSelectedIssue();
        });
    },

    hook : function(){
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        this.initIssues();
    },
    
    setupElements : function() {
        panels.register(this);

        var _self = this;

        // Fix to prevent Active Files button is placed above Project Files
        var el = (navbar.firstChild["class"] == "project_files") ? navbar.childNodes[1] : navbar.firstChild;
        var btn = this.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            "class" : "issues_list",
            caption : "Issues"
        }), el);
        
        btn.addEventListener("mousedown", function(e){
            var value = this.value;
            if (navbar.current && (navbar.current != _self || value)) {
                navbar.current.disable(navbar.current == _self);
                if (value)
                    return;
            }

            panels.initPanel(_self);
            if (_self.appendedColumn === false)
                colLeft.appendChild(winIssuesMgr);

            _self.enable(true);
        });
        
        panels.initPanel(this);
    },

    initIssues : function() {
        var cmd = "issues";

        var data = {
            command : cmd,
            subcommand : "init"
        };

        ide.dispatchEvent("track_action", {type: "issues", cmd: cmd});
        if (ext.execCommand(cmd, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + cmd, {
              data: data
            }) !== false) {
                if (!ide.onLine) {
                    util.alert(
                        "Currently Offline",
                        "Currently Offline",
                        "This operation could not be completed because you are offline."
                    );
                }
                else {
                    ide.send(JSON.stringify(data));
                }
            }
        }
    },

    requestList : function() {
        var cmd = "issues";

        var data = {
            command : cmd,
            subcommand : "list"
        };

        ide.dispatchEvent("track_action", {type: "issues", cmd: cmd});
        if (ext.execCommand(cmd, data) !== false) {
            if (ide.dispatchEvent("consolecommand." + cmd, {
              data: data
            }) !== false) {
                if (!ide.onLine) {
                    util.alert(
                        "Currently Offline",
                        "Currently Offline",
                        "This operation could not be completed because you are offline."
                    );
                }
                else {
                    ide.send(JSON.stringify(data));
                }
            }
        }
    },
    
    array2Xml : function(arr, elName) {
        var out = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            out.push("<", elName, " ");
            var val = arr[i];
            for (var j in val) {
                var attrVal = typeof val[j] === "string" ? 
                    apf.htmlentities(val[j]).replace(/"/g, "&quot;") : val[j];
                out.push(j, '="', attrVal, '" ');
            }

            out.push('internal_counter="', i, '"');
            out.push(' />');
        }

        return "<issues>" + out.join("") + "</issues>";
    },

    onMessage: function(e) {
        var message = e.message;

        if (message.type != "result" && message.subtype != "issues")
            return;
        //console.log(message);

        if (message.body.err) {
            util.alert(
                "Error", 
                "There was an error returned from the server:",
                message.body.err
            );

            return;
        }

        // Is the body coming in piecemeal? Process after this message
        if (!message.body.out)
            return;

        switch(message.body.subcommand) {
            case "init":
                if (message.body.out === "ok") {
                    this.setupElements();
                    this.requestList();
                }
                break;
            case "list":
                this.onListMessage(message);
                break;
            default:
                break;
        }
    },
    
    onListMessage : function(message) {
        // Formulate list
        var list = message.body.out;

        // Set for our records (APF clears out newlines in XML attrs?)
        // Need to save em!
        this.issuesList = {};
        for (var i = 0, len = list.length; i < len; i++)
            this.issuesList[list[i].number] = list[i];

        var listOut = this.array2Xml(list, "issue");
        mdlIssues.load(apf.getXml(listOut));

        lstIssues.setAttribute("empty-message", "No results");
        tbIssuesSearch.enable();
        btnIssuesSort.enable();
    },

    openSelectedIssue : function() {
        if (!lstIssues.selected)
            return;

        var number = lstIssues.selected.getAttribute("number");
        var pageId = "issue" + number;
        if (window[pageId]) {
            tabIssues.set(pageId);
            return;
        }

        var htmlNode = apf.xmldb.getHtmlNode(lstIssues.selected, lstIssues);

        var title = lstIssues.selected.getAttribute("title");
        var body = this.issuesList[number].body.replace(/(\r\n|\n|\r)/gm, "<br />");
        var author = lstIssues.selected.getAttribute("user");

        var htmlArr = ["<h1>", title, '</h1><p class="author">by ',
            '<a class="author_link" href="http://github.com/', author, 
            '" target="_blank">', author,
            '</a></p><p class="issue_body">', body, '</p>'];

        tabIssues.add("Issue" + number, pageId, null, null, function(page) {
            page.setAttribute("class", "issue_detail");
            setTimeout(function() {
                page.$ext.innerHTML = htmlArr.join("");
            });
        });

        tabIssues.set(pageId);

        /*apf.tween.single(detailNode, {
            type: "height",
            from: 0,
            to  : 300,
            anim : apf.tween.EASEOUT,
            steps : 20
        });*/
    },

    enable : function(noButton){
        if (self.winIssuesMgr)
            winIssuesMgr.show();
        colLeft.show();
        if (!noButton) {
            this.button.setValue(true);
            if(navbar.current && (navbar.current != this))
                navbar.current.disable(false);
        }
        splitterPanelLeft.show();
        navbar.current = this;
    },

    disable : function(noButton){
        if (self.winIssuesMgr)
            winIssuesMgr.hide();
        if (!noButton)
            this.button.setValue(false);

        splitterPanelLeft.hide();
    },

    destroy : function(){
        panels.unregister(this);
    }
});

});