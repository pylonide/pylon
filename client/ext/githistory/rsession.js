/**
 * 
 * 
 * @author Matt Pardee
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var GitLogParser = require("ext/githistory/gitlogparser");

module.exports = (function() {
    function RSession() {
        this.gitLogParser = new GitLogParser();

        this.logData = [];
        this.currentLogData = [];
        
        this.lastLoadedGitLog = -1;
        this.firstGitShow = true;
        this.currentText = "";
        this.revisionText = {};
    }

    RSession.prototype = {
        setGitLog : function(data) {
            this.logData = data;
        },

        parseGitLog : function(rawOutput) {
            this.gitLogParser.parseLog(rawOutput);
            this.logData = this.gitLogParser.getLogData();

            for (var gi = 0, logDataLen = this.logData.length; gi < logDataLen; gi++) {
                this.logData[gi].commitLower = this.logData[gi].commit.toLowerCase();
                this.logData[gi].parentLower = this.logData[gi].parent.toLowerCase();
                this.logData[gi].treeLower = this.logData[gi].tree.toLowerCase();
                this.logData[gi].messageJoinedLower = this.logData[gi].message.join("\n").toLowerCase();
                this.logData[gi].author.emailLower = this.logData[gi].author.email.toLowerCase();
                this.logData[gi].author.fullNameLower = this.logData[gi].author.fullName.toLowerCase();
                this.logData[gi].committer.emailLower = this.logData[gi].committer.email.toLowerCase();
                this.logData[gi].committer.fullNameLower = this.logData[gi].committer.fullName.toLowerCase();
            }

            return this.logData;
        },

        getGitLog : function() {
            return this.logData;
        },

        setRevisionText : function(commitHash, text) {
            this.revisionText[commitHash] = text;
        },

        getRevisionText : function(commitHash) {
            return this.revisionText[commitHash];
        },

        setCurrentText : function(text) {
            this.currentText = text;
        },

        getCurrentText : function() {
            return this.currentText;
        },

        getLogDataXml : function() {
            return apf.getXml(this.arrCommits2Xml(this.logData, "commit"));
        },

        setFirstGitShow : function(firstShow) {
            this.firstGitShow = firstShow;
        },

        isFirstGitShow : function() {
            return this.firstGitShow;
        },

        setLastLoadedGitLog : function(position) {
            this.lastLoadedGitLog = position;
        },

        getLastLoadedGitLog : function() {
            return this.lastLoadedGitLog;
        },
        
        setMetaDataOutput : function(output) {
            this.metaDataOutput = output;
        },

        /**
         * Converts an array of commit data to XML
         *
         * @TODO Clean this up. Looks ugly
         * 
         * @param {array} arr Array of commits
         * @param {string} elName The name of each XML element
         * @return {string} The formatted XML string
         */
        arrCommits2Xml : function(arr, elName) {
            var out = ["<", elName, "s>"],
                attrMessage;

            for (var i = 0, len = arr.length; i < len; i++) {
                attrMessage = apf.xmlentities(apf.htmlentities(arr[i].messageJoinedLower));
                attrMessage = attrMessage.replace(/(\r\n|\r|\n)/gm, " ").replace(/"/g, "&quot;");
                out.push("<", elName, " ",
                    'hash="', arr[i].commitLower, '" ',
                    'parenthash="', arr[i].parentLower, '" ',
                    'treehash="', arr[i].treeLower, '" ',
                    'authoremail="', apf.htmlentities(arr[i].author.email), '" ',
                    'authorname="', arr[i].author.fullName, '" ',
                    'committeremail="', apf.htmlentities(arr[i].committer.email), '" ',
                    'committername="', arr[i].committer.fullName, '" ',
                    'timestamp="', arr[i].committer.timestamp, '" ',
                    'message="', attrMessage, '" ',
                    'internal_counter="', i, '"',
                ' />');
            }

            out.push("</", elName, "s>");
            return out.join("");
        }
    };

    return RSession;
})();

});