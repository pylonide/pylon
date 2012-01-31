/**
 * Revision utility methods
 *
 * @copyright 2012, Cloud9 IDE, Inc.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

module.exports = {
    /**
     * Retrieves the file path for the currently selected file tab
     * 
     * @param {string} filePath If we already have it and want to normalize it
     * @return {string} The normalized file path
     */
    getFilePath : function(filePath) {
        if (typeof filePath === "undefined")
            filePath = tabEditors.getPage().$model.data.getAttribute("path");
        if (filePath.indexOf("/workspace/") === 0)
            filePath = filePath.substr(11);

        return filePath;
    },

    /**
     * Creates an HTML element
     * 
     * @param {string} type Type of element, e.g. "div" or "p"
     * @param {object} props Properties to apply
     * @return {element} HTML element
     */
    createElement : function(type, props) {
        var el = document.createElement(type);
        for (var p in props)
            el.setAttribute(p, props[p]);
        return el;
    },

    /**
     * Converts an array of commit data to XML
     *
     * @param {array} arr Array of commits
     * @param {string} elName The name of each XML element
     * @return {string} The formatted XML string
     */
    arrCommits2Xml : function(arr, elName) {
        var out = ["<", elName, "s>"], attrMessage;

        for (var i = 0, len = arr.length; i < len; i++) {
            // Clean up the comit message
            attrMessage = apf.xmlentities(apf.htmlentities(arr[i].messageJoinedLower));
            attrMessage = attrMessage.replace(/(\r\n|\r|\n)/gm, " ").replace(/"/g, "&quot;");
            out.push("<", elName, " ",
                'hash="', arr[i].commit, '" ',
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
    },

    /**
     * Given commit data, returns a table-formatted HTML string
     * 
     * @param {object} data The commit data
     * @param {boolean} includeMessage Whether to include the commit message
     */
    formulateRevisionMetaData : function(data, includeMessage, msgLen) {
        var output, timestamp, fullName, commit, email = "";

        if (data) {
            var date = new Date(data.committer.timestamp*1000);
            timestamp = date.toString("MMM dd, yyyy hh:mm:ss tt");
            fullName = data.committer.fullName;
            email = data.committer.email;
            commit = data.commit.substr(0, 10);
        } else {
            timestamp = fullName = commit = "Uncommitted";
        }

        output = [
            '<table cellspacing="0" cellpadding="0" border="0">',
            '<tr><td class="rev_header">Committer:</td><td>',
            fullName, " ", email, '</td></tr>',
            '<tr><td class="rev_header">Date:</td><td>', timestamp,
            '</td></tr>',
            '<tr><td class="rev_header">Commit:</td><td>', commit,
            '</td></tr>'
        ];

        if (includeMessage) {
            var message;
            if (msgLen) {
                var msgJoined = data.message.join(" ");
                message = msgJoined.substr(0, msgLen);
                if (msgJoined.length > msgLen)
                    message += "...";
            }
            
            else {
                message = data.message.join("<br />");
            }

            output.push('<tr><td class="rev_header">Message:</td><td>',
                message, '</td></tr>');
        }
        output.push('</table>');

        return output.join("");
    }
};

});