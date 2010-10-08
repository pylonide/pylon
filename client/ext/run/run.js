/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/run/run",
    ["core/ide",
     "core/ext",
     "ext/noderunner/noderunner",
     "text!ext/run/run.xml"], function(ide, ext, noderunner, markup) {

return ext.register("ext/run/run", {
    name   : "Run Toolbar",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [noderunner],

    nodes : [],

    init : function(amlNode){
        while(tbRun.childNodes.length) {
            var button = tbRun.firstChild;
            ide.barTools.appendChild(button);
            this.nodes.push(button);
        }
    },

    debugChrome : function() {
        noderunner.chromeDebug();
    },

    debug : function() {
        noderunner.debug();
    },

    $getActivePageModel : function() {
        page = tabEditors.getPage();
        if (!page)
            return null;

        return page.$model.data;
    },

    addConfig : function(debug) {
        var file = this.$getActivePageModel();

        if (!file || (file.getAttribute("contenttype") || "").indexOf("application/javascript") != 0) {
            var path = "";
            var name = "server";
        }
        else {
            path = file.getAttribute("path").slice(noderunner.davPrefix.length)
            name = file.getAttribute("name").replace(/\.js$/, "");
        }

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("debug", debug ? "1" : "")
            .attr("args", "").node();

        mdlRunConfigurations.appendXml(cfg);
        lstRunCfg.select(cfg);
        this.$updateMenu();
        winRunCfgNew.show();
    },

    run : function(debug) {
        var config = lstRunCfg.selected;
        if (!config) {
            this.addConfig(debug);
        }
        else
            this.runConfig(config, debug);
    },

    $updateMenu : function() {
        var item = mnuRunCfg.firstChild;
        while(item && item.tagName !== "a:divider") {
            mnuRunCfg.removeChild(item);
            item = mnuRunCfg.firstChild;
        }
        var divider = item;

        var configs = mdlRunConfigurations.queryNodes("config");
        if (!configs.length)
            mnuRunCfg.insertBefore(new apf.item({disabled:true, caption: "no run history"}), divider);
        else {
            for (var i=0,l=configs.length; i<l; i++) {
                var item = new apf.item({
                    type: "radio",
                    caption: configs[i].getAttribute("name"),
                    checked: configs[i] == lstRunCfg.selected,
                    group: "grpRunCfg"
                });
                item.$config = configs[i];

                var _self = this;
                item.onclick = function() {
                    _self.runConfig(this.config, false);
                    lstRunCfg.select(this.config);
                };
                mnuRunCfg.insertBefore(item, mnuRunCfg.firstChild);
            }
        }
    },

    runConfig : function(config, debug) {
        if (debug === undefined)
            debug = config.getAttribute("debug") == "1";
        noderunner.run(config.getAttribute("path"), config.getAttribute("args"), debug);
    },

    stop : function() {
        noderunner.stop();
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});