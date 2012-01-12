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
var markdown = require("ext/issuesmgr/pagedown-js");
var markedRet = require("ext/issuesmgr/marked");

module.exports = ext.register("ext/issuesmgr/issuesmgr", {
    name     : "Issues Manager",
    dev      : "Cloud9 IDE, Inc.",
    alone    : true,
    type     : ext.GENERAL,
    skin     : skin,
    markup   : markup,
    appendedColumn : false,
    converter : new Markdown.Converter(),
    savedScroll : -1,
    
    normalDate : "MMMM dd, yyyy hh:mm tt",
    updatedDate : "MMMM dd, yyyy hh:mm:ss tt",

    nodes : [],

    init : function(){
        this.panel = winIssuesMgr;

        var _self = this;
        lstIssues.addEventListener("click", function() {
            _self.openSelectedIssue();
        });

        this.issues_back = document.getElementById("issues_back");
        this.issues_back.addEventListener("click", function() {
            _self.showIssuesList();
        });
    },

    hook : function(){
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        this.sendRequest("init");
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
    
    sendRequest : function(subcommand, extra) {
        var cmd = "issues";

        var data = {
            command : cmd,
            subcommand : subcommand
        };

        if (extra)
            data.extra = extra;

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
                    this.projectName = message.body.project.name;
                    this.projectContext = message.body.project.context;
                    this.setupElements();
                    this.sendRequest("list");
                }
                break;
            case "list":
                this.onListMessage(message);
                break;
            case "getcomments":
                this.onCommentsMessage(message);
                break;
            default:
                break;
        }
    },

    sanitizeHtml : function(html) {
        return html.replace(/<[^>]*>/gi, this.sanitizeTag);
    },

    sanitizeTag : function(tag) {
        if (tag.match(/^(<\/?(a|b|blockquote|code|del|dd|dl|dt|em|h1|h2|h3|i|kbd|li|ol|p|pre|s|sup|sub|strong|strike|ul)(\s.*)?>|<(br|hr)\s?\/?>)$/i) ||
            tag.match(/<a\s[^>]*>/i) ||
            tag.match(/^(<img\ssrc="(https?:\/\/|\/)[-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)]+"(\swidth="\d{1,3}")?(\sheight="\d{1,3}")?(\salt="[^"<>]*")?(\stitle="[^"<>]*")?\s?\/?>)$/i))
            return tag;
        else
            return "";
    },

    formulateBody : function(text) {
        // First find issue numbers
        //console.log(text);
        text = text.replace(/#([\d]+)[^\w]/g, "<a href=\"#\" rel=\"$1\" class=\"issuelink\">&#35;$1</a> ");
        //text = this.converter.makeHtml(text);
        text = marked(text);
        text = this.sanitizeHtml(text);
        var usernamesRegex = /(^|\s|>|\(|\))@([\w\.\d\-\_]+)/g;
        return text.replace(usernamesRegex,
            "$1<a class=\"remote\" target=\"_blank\" href=\"http://github.com/$2\">@$2</a>");
    },

    formulateCommentHTML : function(comment) {
        var d, dateStr;
        // Include seconds
        if (comment.updated_at != comment.created_at) {
            d = new Date(comment.created_at);
            dateStr = d.toString(this.updatedDate);
            d = new Date(comment.updated_at);
            dateStr += '<br />updated ' + d.toString(this.updatedDate);
        } else {
            d = new Date(comment.created_at);
            dateStr = d.toString(this.normalDate);
        }

        var htmlArr = ['<div class="comment"><div class="comment_user">',
            '<img class="user_image" src="http://www.gravatar.com/avatar/',
            comment.gravatar_id, '?s=30&d=mm" width="30" height="30" /></div>',
            '<div class="comment_details"><div class="comment_body"><strong>',
            comment.user, ':</strong> ', this.formulateBody(comment.body),
            '</div><p class="created_at">', dateStr,'</p></div></div>'
        ];

        return htmlArr.join("");
    },

    onCommentsMessage : function(message) {
        var comments = message.body.out;
        this.issuesList[message.body.issue_num].comments_arr = comments;

        //console.log(comments);

        var allHtml = [];
        for (var i = 0, len = comments.length; i < len; i++)
            allHtml.push(this.formulateCommentHTML(comments[i]));

        var clistDiv = window["issue" + message.body.issue_num].$ext.getElementsByClassName("issue_comments_list")[0];
        clistDiv.innerHTML = allHtml.join("");

        this.setIssueNumListeners(clistDiv);
    },

    onListMessage : function(message) {
        // Formulate list
        var list = message.body.out;
        //console.log(list);

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
    
    openIssue : function(number) {
        this.issues_back.style.display = "block";
        this.savedScroll = lstIssues.$ext.scrollTop;

        winIssuesMgr.setTitle("#" + number);
        var pageId = "issue" + number;
        if (window[pageId]) {
            tabIssues.set(pageId);
            return;
        }

        var num_comments = this.issuesList[number].comments;
        if (num_comments > 0)
            this.sendRequest("getcomments", number);

        //console.log(this.issuesList[number]);
        var title = this.issuesList[number].title;//getAttribute("title");
        var author = this.issuesList[number].user;//.getAttribute("user");
        var body = this.formulateBody(this.issuesList[number].body);
        var created_at = this.issuesList[number].created_at;
        var updated_at = this.issuesList[number].updated_at;
        var html_url = this.issuesList[number].html_url;
        var labels_arr = this.issuesList[number].labels;
        var state = this.issuesList[number].state;
        var votes = this.issuesList[number].votes;

        var d, dateStr, updatedDateStr = "";
        // Include seconds
        if (updated_at != created_at) {
            d = new Date(created_at);
            dateStr = d.toString(this.updatedDate);
            d = new Date(updated_at);
            updatedDateStr = '<br />updated ' + d.toString(this.updatedDate);
        } else {
            d = new Date(created_at);
            dateStr = d.toString(this.normalDate);
        }

        var htmlArr = ['<div class="issue_header"><img src="http://www.gravatar.com/avatar/',
            this.issuesList[number].gravatar_id, '?s=30&d=mm" width="30" height="30" /><h1>',
            apf.htmlentities(title), '</h1></div><div class="issue_body">', body,
            '</div><p class="author">by ',
            '<a class="remote" href="http://github.com/', author, 
            '" target="_blank">', author, '</a> on <a target="_blank" class="remote" href="',
            html_url, '">', dateStr, '</a>', updatedDateStr, '</p>'
        ];

        if (labels_arr.length) {
            htmlArr.push('<div class="labels">');
            for (var i = 0, len = labels_arr.length; i < len; i++)
                htmlArr.push('<div class="issue_label">', labels_arr[i], '</div>');
            htmlArr.push('</div>');
        }

        htmlArr.push(
            '<div class="issue_comments_divider"><img src="/static/style/images/empty_editor_divider.png" />',
            '</div><div class="issue_comments"><p><strong>Comments (', num_comments,
            ')</strong></p><div class="issue_comments_list"></div></div>'
        );

        var _self = this;
        tabIssues.add("Issue" + number, pageId, null, null, function(page) {
            setTimeout(function() {
                page.$ext.innerHTML = htmlArr.join("");
                _self.setIssueNumListeners(page.$ext);
            });
        });

        tabIssues.set(pageId);
    },

    openSelectedIssue : function() {
        if (!lstIssues.selected)
            return;

        var number = lstIssues.selected.getAttribute("number");
        this.openIssue(number);
    },

    setIssueNumListeners : function(el) {
        var links = el.getElementsByClassName("issuelink");
        var _self = this;
        for (var i = 0, len = links.length; i < len; i++) {
            links[i].addEventListener("click", function(e) {
                e.preventDefault();
                _self.openIssue(e.target.getAttribute("rel"));
            });
        }
    },

    showIssuesList : function() {
        this.issues_back.style.display = "none";
        winIssuesMgr.setTitle("Issues");
        tabIssues.set("pgIssuesList");
        if (apf.isWebkit)
            lstIssues.$ext.scrollTop = this.savedScroll;
    },
    
    updateListCount: function() {
        //console.log(lstIssues.getTraverseNodes().length);
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