/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/settings/settings.xml");
var panels = require("ext/panels/panels");
var skin = require("text!ext/settings/skin.xml");
var settings = require("core/settings");
var commands = require("ext/commands/commands");
var panelSettings =  require("text!ext/panels/settings.xml");

module.exports = ext.register("ext/settings/settings", {
    name    : "Preferences",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    skin    : {
        id   : "prefs",
        data : skin,
        "media-path" : ide.staticPrefix + "/ext/settings/images/"
    },

    defaultWidth : 250,

    nodes : [],

    //Backwards compatible
    save : function(force) {
        settings.save(force);
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml(apf.n("<" + apf.escapeXML(tagName) + "/>").attr("name", name).node(), xpath);
    },

    hook : function(){
        var _self = this;

        this.markupInsertionPoint = colLeft;

        panels.register(this, {
            position : 100000,
            caption: "Preferences",
            "class": "preferences",
            command: "opensettingspanel"
        });

        commands.addCommand({
            name: "opensettingspanel",
            hint: "show the open settings panel",
            bindKey: {mac: "Command-,", win: "Ctrl-,"},
            exec: function () {
                _self.show();
            }
        });

        //Backwards compatible
        this.model = settings.model;
        this.setDefaults = settings.setDefaults;
    },

    headings : {},
    getHeading : function(name){
        if (this.headings[name])
            return this.headings[name];

        var heading = barSettings.appendChild(new apf.bar({
            skin: "basic"
        }));
        heading.$int.innerHTML = '<div class="header"><span></span><div>'
            + apf.escapeXML(name) + '</div></div>';

        this.headings[name] = heading;

        return heading;
    },

    init : function(amlNode){
        this.panel = winSettings;
        this.nodes.push(winSettings);

        // this has to be done out here for some reason
        this.addSettings("General",  panelSettings );
    },

    addSettings : function(group, markup, callback) {
        ide.addEventListener("init.ext/settings/settings", function(e) {
            var heading = e.ext.getHeading(group);
            var last    = heading.lastChild;

            heading.insertMarkup(markup);

            if (!heading.$map)
                heading.$map = {};

            var nodes = [];

            if (!last) {
                last = heading.firstChild
                nodes.push(last);
            }
            while (!last) {
                nodes.push(last = last.nextSibling);
            }

            if (nodes.length == 0) {
                nodes = heading.childNodes;
            }

            for (var nextSibling, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType == 1 && nodes[i].position) {
                    heading.$map[nodes[i].position] = nodes[i];
                    nextSibling = findNextSibling(nodes[i], heading);
                    if (nextSibling !== undefined && nodes[i].nextSibling != nextSibling)
                        heading.insertBefore(nodes[i], nextSibling);
                }
            }

            function findNextSibling(node, heading){
                var map = heading.$map, beforeNode, diff = 1000000;
                for (var pos in map) {
                    var d = pos - node.position;
                    if (d > 0 && d < diff) {
                        beforeNode = heading.$map[pos];
                        diff = d;
                    }
                }
                return beforeNode;
            }

            callback && callback();
        });
    },

    show : function(e) {
        if (!this.panel || !this.panel.visible) {
            panels.activate(this);
            this.enable();
        }
        else {
            panels.deactivate(null, true);
        }

        return false;
    },

    destroy : function(){
        commands.removeCommandByName("opensettingspanel");
        panels.unregister(this);
        this.$destroy();
    }
});

});
