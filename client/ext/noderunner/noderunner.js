/**
 * Node Runner Module for the Ajax.org Cloud IDE
 */
require.def("ext/noderunner/noderunner",
    ["core/ide",
     "core/ext",
     "ext/tree/tree",
     "text!ext/noderunner/noderunner.xml",
     "/socket.io/socket.io.js"],
    function(ide, ext, tree, markup) {
        return {
            type   : ext.GENERAL,
            markup : markup,

            nodes : [],

            init : function(amlNode){
                while(tbNoderunner.childNodes.length) {
                    var button = tbNoderunner.firstChild;
                    ide.barTools.appendChild(button);
                    this.nodes.push(button);
                }

                this.nodes[0].onclick = this.run.bind(this);
                this.nodes[1].onclick = this.kill.bind(this);

                var options = {
                    transports: ['websocket', 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling']
                };
                this.socket = new io.Socket(null, options);
                this.socket.on("message", this.onMessage.bind(this));
                this.socket.on("connect", this.onConnect.bind(this));
                this.socket.connect();
            },

            onMessage : function(message) {
                var message = JSON.parse(message);

                console.log("MSG:", message);
                switch(message.type) {
                    case "node-exit":
                        stRunning.deactivate();
                        break;

                    case "node-data":
                        //ide.log(message.data);
                        break;
                }
            },

            onConnect : function() {
                console.log("connected");
                stConnected.activate();
            },

            run : function() {
                if (stRunning.active || !stConnected.active)
                    return;

                var file = tree.trFiles.selected;
                if (!file)
                    return;

                if (file.getAttribute("contenttype").indexOf("application/javascript") != 0)
                    return;

                console.log("running", file);
                var command = {
                    "command": "Run",
                    "file": this.$getPath(file)
                };
                this.socket.send(JSON.stringify(command));
                stRunning.activate();
            },

            kill : function() {
                if (!stRunning.active)
                    return

                this.socket.send(JSON.stringify({"command": "kill"}));
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
            },

            $getPath : function(fileEl) {
                var path = [fileEl.getAttribute("name")];

                while (fileEl.parentNode.tagName == "folder") {
                    fileEl = fileEl.parentNode;
                    path.push(fileEl.getAttribute("name"));
                }

                return path.reverse().join("/");
            }
        };
    }
);