/**
 * 
 * 
 * @author Matt Pardee
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var rsession = require("ext/githistory/rsession");
var rutil = require("ext/githistory/util");
var timeline = require("ext/githistory/timeline");

module.exports = (function() {
    function RState() {
        this.sessions = {};
        this.currentFile = "";
        this.lastFileLoaded = "";
    }

    RState.prototype = {
        addSession : function(file) {
            this.sessions[file] = new rsession();
            return this.sessions[file];
        },

        getSession : function(file) {
            if (file)
                return this.sessions[file];

            return this.sessions[this.currentFile];
        },

        setCurrentFile : function(file) {
            this.currentFile = file;
        },

        getCurrentFile : function() {
            return this.currentFile;
        },

        setLastFileLoaded : function(file) {
            this.lastFileLoaded = file;
        },

        getLastFileLoaded : function() {
            return this.lastFileLoaded;
        },

        restoreState : function(session) {
            var mdlOut = session.getLogDataXml();
            mdlCommits.load(mdlOut);

            var gitLog = session.getGitLog();
            var output = rutil.formulateRevisionMetaData(gitLog[session.lastLoadedGitLog], true);
            versionsLabel.setValue(output);

            if (session.isFirstGitShow() === false)
                currentVersionsLabel.setValue(session.metaDataOutput);

            timeline.setupTimeline(gitLog);
            tbRevisionsSearch.enable();

            gitLog[session.getLastLoadedGitLog()].dotEl.setAttribute("class", "current");
        }
    };

    return RState;
})();

});