/**
 * GitLogParser is a JavaScript parser for inflating a data object from the
 * output of a `git log --format=raw -- [file]` operation
 * 
 * @author Matt Pardee
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

module.exports = (function() {
     
    function GitLogParser() {
        this.arrLogData = [];
        this.currentLine = {
            commit : "",
            tree : "",
            parent : "",
            author : {},
            committer : {},
            message : []
        };
    }

    GitLogParser.prototype = {
        /**
         * The entry point for parsing the output from git log
         * 
         * @param {string} log The output as a string
         */
        parseLog : function(log) {
            this.arrLogData = [];
            this.currentLine = {
                commit : "",
                tree : "",
                parent : "",
                author : {},
                committer : {},
                message : []
            };

            var lines = log.split('\n');
            //console.log(lines);

            for (var lineIt in lines)
                this.parseLine(lines[lineIt]);
        },

        getLogData : function() {
            return this.arrLogData;
        },

        parseLine : function(line) {
            if (line === "" || typeof line !== "string")
                return;

            var splitLine = line.split(" ");

            // Tab character means part of the commit message
            if (splitLine[0] === "") {
                this.currentLine.message.push(line.substr(4));
                return;
            }

            switch (splitLine[0]) {
                case "commit":
                    if (this.currentLine.tree !== "")
                        this.arrLogData.push(this.currentLine);

                    this.currentLine = {
                        commit : splitLine[1],
                        tree : "",
                        parent : "",
                        author : {},
                        committer : {},
                        message : []
                    };
                    break;
                case "tree":
                    this.currentLine.tree = splitLine[1];
                    break;
                case "parent":
                    this.currentLine.parent = splitLine[1];
                    break;
                case "author":
                    this.currentLine.author = this.parseUserLine(splitLine);
                    break;
                case "committer":
                    this.currentLine.committer = this.parseUserLine(splitLine);
                    break;
                default:
                    break;
            }
        },

        parseUserLine : function(splitLine) {
            var len = splitLine.length;
            var user = {
                fullName : splitLine.slice(1, len-3).join(" "),
                email : splitLine[len-3],
                timestamp : splitLine[len-2],
                tzOffset : splitLine[len-1]
            };

            return user;
        }
    };

    return GitLogParser;
})();

});