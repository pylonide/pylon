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
            "media-path": ide.staticPrefix + "/ext/help/images/"
        },
        showingAll: true,

        hook : function(){
            var _self = this;

            var mnuHelp = new ppc.menu();

            this.nodes.push(
                menus.addItemByPath("Help/", mnuHelp, 100000)
            );


            var c = 0;
            menus.addItemByPath("Help/About", new ppc.item({ onclick : function(){ _self.showAbout(); }}), c += 100);
            var mnuChangelog = menus.addItemByPath("Help/Changelog", new ppc.item({ onclick : function(){ window.open('https://github.com/exsilium/cloud9/releases'); }}), c += 100);

            menus.addItemByPath("Help/~", new ppc.divider(), c += 100);
            ide.addEventListener("hook.ext/keybindings_default/keybindings_default", function(c, e) {
                menus.addItemByPath("Help/Keyboard Shortcuts", new ppc.item({ onclick : function(){ e.ext.keybindings(); }}), c);
            }.bind(this, c += 100));
            ide.addEventListener("hook.ext/quickstart/quickstart", function(c, e) {
                menus.addItemByPath("Help/Quick Start", new ppc.item({ onclick : function(){ e.ext.launchQS(); }}), c);
            }.bind(this, c += 100));
            ide.addEventListener("hook.ext/guidedtour/guidedtour", function(c, e) {
                menus.addItemByPath("Help/Take a Guided Tour", new ppc.item({ onclick : function(){ e.ext.launchGT(); }}), c);
            }.bind(this, c += 100));
            menus.addItemByPath("Help/~", new ppc.divider(), c += 100);

            menus.addItemByPath("Help/Support/", null, c += 100);
            menus.addItemByPath("Help/~", new ppc.divider(), c += 100);
            menus.addItemByPath("Help/Learning/", null, c += 100);
            menus.addItemByPath("Help/~", new ppc.divider(), c += 100);
            menus.addItemByPath("Help/Get in Touch/", null, c += 100);

            c = 0;
            menus.addItemByPath("Help/Support/GitHub Issues", new ppc.item({ onclick : function(){ window.open('https://github.com/exsilium/cloud9/issues'); }}), c += 100);

            c = 0;
            menus.addItemByPath("Help/Learning/GitHub Wiki", new ppc.item({ onclick : function(){ window.open('https://github.com/exsilium/cloud9/wiki'); }}), c += 100);

            c = 0;
            menus.addItemByPath("Help/Get in Touch/GitHub Issues", new ppc.item({ onclick : function(){ window.open('https://github.com/exsilium/cloud9/issues'); }}), c += 100);

            if (window.cloud9config.hosted || (ide.local && ide.onLine)) {
                var blogURL = window.location.protocol + "//" + window.location.host + "/site/?json=get_tag_posts&tag_slug=changelog&count=1";

                ppc.ajax(blogURL, {
                    method: "GET",
                    contentType: "application/json",
                    callback: function(data, state) {
                        if (state == ppc.SUCCESS) {
                            if (data !== undefined) {
                                var latestDate = "";

                                try {
                                    // fixes a potential issue with a stupid "WP Super Cache" comment
                                    var jsonBlog = JSON.parse(data.replace(/<!-- .+? -->/, ""));
                                    
                                    // date format is 2012-11-06 21:41:07; convert it to something better lookin'
                                    latestDate = " (" + jsonBlog.posts[0].date.split(" ")[0].replace(/-/g, ".") + ")";
                                } catch (e) {
                                    console.error("Changelog JSON parse failed: " + e);
                                }

                                mnuChangelog.setAttribute("caption",  "Changelog" + latestDate);
                            }
                        }
                    }
                });
            }
        },

        init: function(amlNode) {
            ppc.importCssString((this.css || ""));
        },

        showAbout: function() {
            ext.initExtension(this);

            aboutDialog.show();
            document.getElementById("c9Version").innerHTML = ppc.escapeXML("Version " + window.cloud9config.version);
        }
    });

});