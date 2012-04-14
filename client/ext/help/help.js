/**
 * Help menu for the Cloud 9 IDE
 * 
 * @author Garen J. Torikian
 * 
 * @copyright 2011, Cloud9 IDE, Inc
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

    var ide = require("core/ide");
    var ext = require("core/ext");
    var menus = require("ext/menus/menus");
    var markup = require("text!ext/help/help.xml");
    var css = require("text!ext/help/style.css");
    var skin = require("text!ext/help/skin.xml");

    module.exports = ext.register("ext/help/help", {
        name: "Help Menu",
        dev: "Cloud9 IDE, Inc.",
        alone: true,
        type: ext.GENERAL,
        nodes: [],
        markup: markup,
        css: css,
        panels: {},
        skin: {
            id: "help-skin",
            data: skin,
            "media-path": "/static/ext/help/images/"
        },
        showingAll: true,

        init: function(amlNode) {
            apf.importCssString((this.css || ""));
            
            this.nodes.push(
                menus.addItemByPath("Help/", null, 100000)
            );

            if (window.location.host.indexOf("c9.io") >= 0 || window.location.host.indexOf("stage.io") >= 0) {                
                var blogURL = window.location.protocol + "//" + window.location.host + "/site/?json=get_tag_posts&tag_slug=changelog";
    
                var response = apf.ajax(blogURL, {
                    method: "GET",
                    contentType: "application/json",
                    async: true,
                    data: JSON.stringify({
                        agent: navigator.userAgent,
                        type: "C9 SERVER EXCEPTION"
                    }),
                    callback: function( data, state) {
                        if (state == apf.SUCCESS) {
                            if (data !== undefined) {
                                var jsonBlog = JSON.parse(data);
                                var latestDate = jsonBlog.posts[0].date;
        
                                mnuChangelog.setAttribute("caption", mnuChangelog.caption + " (" + latestDate.split(" ")[0].replace(/-/g, ".") + ")");
                            }
                        }
                    }
                });
            }
        },

        showAbout: function() {
            aboutDialog.show();
            document.getElementById("c9Version").innerHTML = "Version " + window.cloud9config.version;
        },

        launchTwitter: function() {
            alert("Let's go to Twitter!");
        },

        enable: function() {
            this.nodes.each(function(item) {
                item.enable();
            });
        },

        disable: function() {
            this.nodes.each(function(item) {
                item.disable();
            });
        },

        destroy: function() {
            this.nodes.each(function(item) {
                item.destroy(true, true);
            });
            this.nodes = [];
        }
    });

});