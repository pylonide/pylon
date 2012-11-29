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

            var mnuHelp = new apf.menu();

            this.nodes.push(
                menus.addItemByPath("Help/", mnuHelp, 100000)
            );


            var c = 0;
            menus.addItemByPath("Help/About", new apf.item({ onclick : function(){ _self.showAbout(); }}), c += 100);
            menus.addItemByPath("Help/IDE Status", new apf.item({ onclick : function(){window.open('http://status.c9.io'); }}), c += 100);
            var mnuChangelog = menus.addItemByPath("Help/Changelog", new apf.item({ onclick : function(){ window.open('http://c9.io/site/tag/changelog/') }}), c += 100);

            menus.addItemByPath("Help/~", new apf.divider(), c += 100);
            //menus.addItemByPath("Help/Documentation", new apf.item({ onclick : function(){ window.open('https://docs.c9.io') }}), c += 100);
            ide.addEventListener("hook.ext/keybindings_default/keybindings_default", function(c, e) {
                menus.addItemByPath("Help/Keyboard Shortcuts", new apf.item({ onclick : function(){ e.ext.keybindings(); }}), c);
            }.bind(this, c += 100));
            ide.addEventListener("hook.ext/quickstart/quickstart", function(c, e) {
                menus.addItemByPath("Help/Quick Start", new apf.item({ onclick : function(){ e.ext.launchQS(); }}), c);
            }.bind(this, c += 100));
            ide.addEventListener("hook.ext/guidedtour/guidedtour", function(c, e) {
                menus.addItemByPath("Help/Take a Guided Tour", new apf.item({ onclick : function(){ e.ext.launchGT(); }}), c);
            }.bind(this, c += 100));
            menus.addItemByPath("Help/~", new apf.divider(), c += 100);

            menus.addItemByPath("Help/Support/", null, c += 100);
            menus.addItemByPath("Help/~", new apf.divider(), c += 100);
            menus.addItemByPath("Help/Learning/", null, c += 100);
            menus.addItemByPath("Help/~", new apf.divider(), c += 100);
            menus.addItemByPath("Help/Get in Touch/", null, c += 100);

            c = 0;
            menus.addItemByPath("Help/Support/FAQ", new apf.item({ onclick : function(){ window.open('http://support.cloud9ide.com/forums/20346041-frequently-asked-questions'); }}), c += 100);
            menus.addItemByPath("Help/Support/Troubleshooting Tips", new apf.item({ onclick : function(){ window.open('http://support.cloud9ide.com/forums/20329737-troubleshooting') }}), c += 100);

            c = 0;
            menus.addItemByPath("Help/Learning/YouTube Channel for Cloud9 IDE", new apf.item({ onclick : function(){ window.open('http://www.youtube.com/user/c9ide/videos?view=pl'); }}), c += 100);

            c = 0;
            menus.addItemByPath("Help/Get in Touch/Blog", new apf.item({ onclick : function(){ window.open('http://blog.c9.io/'); }}), c += 100);
            menus.addItemByPath("Help/Get in Touch/Twitter (for Cloud9 IDE support)", new apf.item({ onclick : function(){ window.open('https://twitter.com/#!/C9Support'); }}), c += 100);
            menus.addItemByPath("Help/Get in Touch/Twitter (for general Cloud9 tweets)", new apf.item({ onclick : function(){ window.open('https://twitter.com/#!/cloud9ide'); }}), c += 100);
            menus.addItemByPath("Help/Get in Touch/Facebook", new apf.item({ onclick : function(){ window.open('https://www.facebook.com/Cloud9IDE'); }}), c += 100);

            if (window.cloud9config.hosted || (ide.local && ide.onLine)) {
                var blogURL = window.location.protocol + "//" + window.location.host + "/site/?json=get_tag_posts&tag_slug=changelog&count=1";

                apf.ajax(blogURL, {
                    method: "GET",
                    contentType: "application/json",
                    callback: function(data, state) {
                        if (state == apf.SUCCESS) {
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
            apf.importCssString((this.css || ""));
        },

        showAbout: function() {
            ext.initExtension(this);

            aboutDialog.show();
            document.getElementById("c9Version").innerHTML = apf.escapeXML("Version " + window.cloud9config.version);
        },

        launchTwitter: function() {
            alert("Let's go to Twitter!");
        }
    });

});