/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/openfiles/openfiles",
    ["core/ide", "core/ext",
     "ext/editors/editors", "ext/settings/settings",
     "ext/panels/panels", "text!ext/openfiles/openfiles.xml"],
    function(ide, ext, editors, settings, panels, markup) {

return ext.register("ext/openfiles/openfiles", {
    name            : "Active Files",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,

    hook : function(){
        panels.register(this);

        var btn = this.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            "class" : "open_files",
            caption : "Active Files"
        }), navbar.firstChild);

        var _self = this;
        var model = this.model = new apf.model().load("<files />");

        btn.addEventListener("mousedown", function(e){
            var value = this.value;
            if (navbar.current && (navbar.current != _self || value)) {
                navbar.current.disable(navbar.current == _self);
                if (value) {
                    return;
                }
            }

            panels.initPanel(_self);
            _self.enable(true);
        });

        ide.addEventListener("afteropenfile", function(e){
            var node = e.doc.getNode();
            if (!model.queryNode("//node()[@path='" + node.getAttribute("path") + "']"))
                model.appendXml(apf.getCleanCopy(node));
        });

        ide.addEventListener("closefile", function(e){
            var node = e.xmlNode;
            model.removeXml("//node()[@path='" + node.getAttribute("path") + "']");
        });

        ide.addEventListener("updatefile", function(e){
            var node  = e.xmlNode;
            var fNode = model.queryNode("//node()[@path='" + e.path + "']");
            if (node && fNode) {
                fNode.setAttribute("path", node.getAttribute("path"));
                if (e.name)
                    apf.xmldb.setAttribute(fNode, "name", apf.getFilename(e.name));
            }
        });
    },

    init : function() {
        this.panel = winOpenFiles;

        var _self = this;
        colLeft.appendChild(winOpenFiles);
        lstOpenFiles.setModel(this.model);

        lstOpenFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || this.selection.length > 1) //ide.onLine can be removed after update apf
                return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });

        lstOpenFiles.addEventListener("afterremove", function(e){
            //Close selected files
            var sel = this.getSelection();
            for (var i = 0; i < sel.length; i++) {
                tabEditors.remove(tabEditors.getPage(sel[i].getAttribute("path")));
            }
        });

        tabEditors.addEventListener("afterswitch", function(e){
            var page = e.nextPage;
            if (page) {
                var node = _self.model.queryNode("//node()[@path='" + page.$model.data.getAttribute("path") + "']");
                if (node)
                    lstOpenFiles.select(node);
            }
        });

        ide.addEventListener("treechange", function(e) {
            var path    = e.path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                .replace(/\[@name="workspace"\]/, "")
                                .replace(/\//, ""),
                parent  = trFiles.getModel().data.selectSingleNode(path),
                nodes   = parent.childNodes,
                files   = e.files,
                removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node    = nodes[i],
                    name    = node.getAttribute("name");

                if (files[name])
                    delete files[name];
                else
                    removed.push(node);
            }
            removed.forEach(function (node) {
                // console.log("REMOVE", node);
                apf.xmldb.removeNode(node);
            });
            path = parent.getAttribute("path");
            for (var name in files) {
                var file = files[name];

                xmlNode = "<" + file.type +
                    " type='" + file.type + "'" +
                    " name='" + name + "'" +
                    " path='" + path + "/" + name + "'" +
                "/>";
                // console.log("CREATE", xmlNode, parent);
                trFiles.add(xmlNode, parent);
            }
        });
    },

    enable : function(noButton){
        if (self.winOpenFiles)
            winOpenFiles.show();
        colLeft.show();
        if (!noButton) {
            this.button.setValue(true);
            if(navbar.current && (navbar.current != this))
                navbar.current.disable(false);
        }

        navbar.current = this;
    },

    disable : function(noButton){
        if (self.winOpenFiles)
            winOpenFiles.hide();
        if (!noButton)
            this.button.setValue(false);
    },

    destroy : function(){
        panels.unregister(this);
    }
});

});
