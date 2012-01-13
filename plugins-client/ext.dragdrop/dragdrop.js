/**
 * Native drag 'n drop upload for Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

define(function(require, exports, module) {

var ide  = require("core/ide");
var ext  = require("core/ext");
var fs   = require("ext/filesystem/filesystem");
var uploadfiles   = require("ext/uploadfiles/uploadfiles");

module.exports = ext.register("ext/dragdrop/dragdrop", {
    dev         : "Ajax.org",
    name        : "Dragdrop",
    alone       : true,
    type        : ext.GENERAL,

    nodes       : [],
    deps        : [fs],

    init: function() {
        var _self  = this;

        var dropbox = document.createElement("div");
        apf.setStyleClass(dropbox, "draganddrop");

        var label = document.createElement("span");
        label.textContent = "Drop files here to upload";
        dropbox.appendChild(label);

        function decorateNode(holder, id) {
            dropbox = holder.dropbox = dropbox.cloneNode(true);
            dropbox.setAttribute("id", id);
            holder.appendChild(dropbox);

            holder.addEventListener("dragenter", dragEnter, false);
            dropbox.addEventListener("dragleave", dragLeave, false);
            dropbox.addEventListener("drop", dragDrop, false);

            ["dragexit", "dragover"].forEach(function(e) {
                dropbox.addEventListener(e, noopHandler, false);
            });
        }

        ide.addEventListener("init.ext/editors/editors", function(){
            _self.nodes.push(tabEditors.$ext);
            decorateNode(tabEditors.$ext, "tabEditorsDropArea");
        });

        ide.addEventListener("init.ext/tree/tree", function(){
            var tree = trFiles.$ext;

            _self.nodes.push(tree);

            tree.addEventListener("dragenter", dragToTreeEnter, false);
            tree.addEventListener("dragleave", dragToTreeLeave, false);
            tree.addEventListener("drop", dragToTreeDrop, false);
            tree.addEventListener("dragover", dragToTreeOver, false);

            tree.addEventListener("dragexit", noopHandler, false);
        });

        ide.addEventListener("init.ext/uploadfiles/uploadfiles", function(){
            winUploadFiles.addEventListener("afterrender", function(){
                _self.nodes.push(uploadDropArea);

                uploadDropArea.addEventListener("dragenter", dragEnter, false);
                uploadDropArea.addEventListener("dragleave", dragLeave, false);
                uploadDropArea.addEventListener("drop", dragDrop, false);
                ["dragexit", "dragover"].forEach(function(e) {
                    uploadDropArea.addEventListener(e, noopHandler, false);
                });
            });
        });

        this.dragStateEvent = {"dragenter": dragEnter};
        var lastHtmlTreeDropNode;
        var lastTreeDropNode;
        var hoverTimer;
        var hoverTarget;
        var lastScrollTo;

        function dragToTreeLeave(e) {
            apf.stopEvent(e);
            apf.setStyleClass(lastHtmlTreeDropNode, null, ["dragAppendUpload"]);
            if(hoverTimer)
                clearTimeout(hoverTimer);
            hoverTarget = null;
        }

        function dragToTreeEnter(e) {
            apf.stopEvent(e);
            //apf.setStyleClass(trFiles.$ext, "dragAppend");
        }

        function dragToTreeOver(e) {
            apf.stopEvent(e);

            var targetHtmlNode = e.target;
            var targetNode;
            var actualTargetNode;

            while(!targetHtmlNode.id && targetHtmlNode.tagName != 'div')
                targetHtmlNode = targetHtmlNode.parentNode;

            targetNode = apf.xmldb.findXmlNode(targetHtmlNode);

            if(!targetNode)
                targetNode = trFiles.xmlRoot.selectSingleNode("folder");

            actualTargetNode = targetNode;

            if (targetNode.getAttribute("type") != "folder"
                && targetNode.tagName != "folder") {
                targetNode = targetNode.parentNode;
                targetHtmlNode = apf.xmldb.findHtmlNode(targetNode, trFiles);
            }

            lastHtmlTreeDropNode = targetHtmlNode;
            lastTreeDropNode = targetNode;
            apf.setStyleClass(targetHtmlNode, "dragAppendUpload");

            //this will expand the folder if you hover over it
            if (hoverTarget != actualTargetNode
                && actualTargetNode.getAttribute("type") == "folder"
                && actualTargetNode.tagName == "folder") {
                hoverTarget = actualTargetNode;
                if(hoverTimer)
                    clearTimeout(hoverTimer);

                hoverTimer = setTimeout(function(){
                    trFiles.slideOpen(null, actualTargetNode, true);
                }, 1000);
            }

            //this will scroll down or up the tree
            var scrollNode;
            var selHtml = apf.xmldb.getHtmlNode(actualTargetNode, trFiles);
            if(selHtml) {
                var hoverElTopPos = apf.getAbsolutePosition(selHtml, trFiles.$container)[1];
                //go down
                if (hoverElTopPos + 25 > trFiles.$container.scrollTop + trFiles.$container.offsetHeight) {
                    scrollNode = findSiblingToScrollTo(actualTargetNode, "next");
                    if(scrollNode) {
                        trFiles.scrollIntoView(scrollNode);

                        if(hoverTimer)
                            clearTimeout(hoverTimer);
                    }
                }
                //go up
                else if (trFiles.$container.scrollTop != 0 && hoverElTopPos - 25 < trFiles.$container.scrollTop) {
                    scrollNode = findSiblingToScrollTo(actualTargetNode, "previous");
                    if (scrollNode) {
                        trFiles.scrollIntoView(scrollNode, true);

                        if (hoverTimer)
                            clearTimeout(hoverTimer);
                    }
                }
            }
        }

        function findSiblingToScrollTo(overNode, dir){
            var scrollNode = overNode[dir == "next" ? "nextSibling" : "previousSibling"];

            while (!scrollNode)
                scrollNode = (scrollNode || overNode).parentNode;

            if (overNode == lastScrollTo && scrollNode[dir == "next" ? "nextSibling" : "previousSibling"])
                scrollNode = scrollNode[dir == "next" ? "nextSibling" : "previousSibling"];

            return lastScrollTo = scrollNode[dir == "next" ? "nextSibling" : "previousSibling"] || scrollNode;;
        }

        function dragToTreeDrop(e) {
            trFiles.select(lastTreeDropNode);
            dragToTreeLeave.call(this, e);
            return uploadfiles.onBeforeDrop(e);
        }


        function dragLeave(e) {
            if (this.disableDropbox)
                return;

            apf.stopEvent(e);
            apf.setStyleClass(this, null, ["over"]);
        }

        function dragEnter(e) {
            if (this.disableDropbox)
                return;

            apf.stopEvent(e);
            apf.setStyleClass(this.dropbox || this, "over");
        }

        function dragDrop(e) {
            if (this.disableDropbox)
                return;

            dragLeave.call(this, e);
            return uploadfiles.onBeforeDrop(e);
        }

        function noopHandler(e) {
            if (this.disableDropbox)
                return;

            apf.stopEvent(e);
        }
    },

    enable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.addEventListener(e, _self.dragStateEvent[e], false);
        });
    },

    disable: function() {
        var _self = this;
        this.nodes.each(function(item) {
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
    },

    destroy: function() {
        var _self = this;
        this.nodes.each(function(item){
            item.removeChild(item.dropbox);
            for (var e in _self.dragStateEvent)
                item.removeEventListener(e, _self.dragStateEvent[e], false);
        });
        this.nodes = [];
    }
});

});