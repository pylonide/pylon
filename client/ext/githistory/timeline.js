/**
 * Revision timeline handler
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var rutil = require("ext/githistory/util");

module.exports = {
    /**
     * Removes all the points along the timeline and their listeners
     * 
     * @param {array} logData Array holding all the points
     */
    removeTimelinePoints : function(logData) {
        for (var i = 0, len = logData.length; i < len; i++) {
            logData[i].dotEl.removeEventListener("mouseover", logData[i].dotElMouseOver);
            logData[i].dotEl.removeEventListener("mouseout", logData[i].dotElMouseOut);
            logData[i].dotEl.removeEventListener("click", logData[i].dotElClick);
            this.timelineEl.removeChild(logData[i].dotEl);
        }
    },

    /**
     * Creates the points along the timeline
     * 
     * @param {array} logData Array of all the commits
     */
    setupTimeline : function(logData) {
        if (!logData.length)
            return;

        if (!this.timelineEl) {
            vbHistoricalHeader.$ext.appendChild(
                rutil.createElement("div", { "id": "versionsSliderBg" })
            );

            this.timelineEl = rutil.createElement("div", {
                "id": "versionsHistoricalSlider"
            });
            vbHistoricalHeader.$ext.appendChild(this.timelineEl);

            this.timelineTooltip = rutil.createElement("div", {
                "id" : "slider_tooltip"
            });
            vbVersions.$ext.appendChild(this.timelineTooltip);
        }

        var _self = this;

        var len = logData.length;
        var tsBegin = logData[0].committer.timestamp;
        var timeSpan = logData[len-1].committer.timestamp - tsBegin;

        // Create all the points in time
        for (var i = 0; i < len; i++) {
            var ts = logData[i].committer.timestamp;
            var tsDiff = ts - tsBegin;
            var percentage = (tsDiff / timeSpan) * 100;

            logData[i].dotEl = rutil.createElement("u", {
                "style" : "left: " + percentage + "%",
                "rel" : i,
                "hash" : logData[i].commit
            });

            logData[i].dotEl.addEventListener("mouseover", logData[i].dotElMouseOver = function() {
                var dotClass = this.getAttribute("class");
                if(dotClass && dotClass.split(" ")[0] == "pop")
                    return;
                var it = this.getAttribute("rel");
                var output = rutil.formulateRevisionMetaData(logData[it], true, 30);
                _self.timelineTooltip.innerHTML = output;

                var pos = apf.getAbsolutePosition(this);

                var sttWidth = apf.getHtmlInnerWidth(_self.timelineTooltip);
                var leftPos = pos[0] - (sttWidth/2);
                if (leftPos < 0)
                    leftPos = 5;

                Firmin.animate(_self.timelineTooltip, {
                    left: leftPos+"px"
                }, 0, function() {
                    Firmin.animate(_self.timelineTooltip, {
                        translateY: -40,
                        scale: 1,
                        opacity: 1
                    }, 0.3);
                });
            });

            logData[i].dotEl.addEventListener("mouseout", logData[i].dotElMouseOut = function() {
                Firmin.animate(_self.timelineTooltip, {
                    scale: 0.1,
                    opacity: 0
                }, 0.4);
            });

            logData[i].dotEl.addEventListener("click", logData[i].dotElClick = function() {
                ide.dispatchEvent("loadrevision", { num : this.getAttribute("rel") });
            });

            this.timelineEl.appendChild(logData[i].dotEl);
        }
    },

    /**
     * Given a search term, filter the timeline based on
     * available commit data
     * 
     * @param {string} filter The search term to filter with
     */
    filterTimeline : function(filter, rstate) {
        var file = rstate.getCurrentFile();
        var logs = rstate.getSession(file).getGitLog();

        filter = filter.toLowerCase();

        var filteredCommits = [], explodedPoints = {};

        for (var gi = 0; gi < logs.length; gi++) {
            if (logs[gi].commitLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].parentLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].treeLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].messageJoinedLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.emailLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].author.fullNameLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.emailLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }
            if (logs[gi].committer.fullNameLower.indexOf(filter) >= 0) {
                filteredCommits.push(logs[gi]);
                continue;
            }

            explodedPoints[gi] = true;
        }

        var isCurrent = false;
        for(var i = 0; i < logs.length; i++) {
            var currClass = logs[i].dotEl.getAttribute("class");
            if (currClass && currClass.length && currClass.indexOf("current") != -1)
                isCurrent = true;
            else
                isCurrent = false;

            if (explodedPoints[i]) {
                if (isCurrent)
                    logs[i].dotEl.setAttribute("class", "pop current");
                else
                    logs[i].dotEl.setAttribute("class", "pop");
            } else {
                if (isCurrent)
                    logs[i].dotEl.setAttribute("class", "current");
                else
                    logs[i].dotEl.setAttribute("class", "");
            }
        }
    }
};

});