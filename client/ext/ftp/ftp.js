/**
 * FTP Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {
 
var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var canon = require("pilot/canon");
var editors = require("ext/editors/editors");
var ideConsole = require("ext/console/console");
var filesystem = require("ext/filesystem/filesystem");
var markup = require("text!ext/ftp/ftp.xml");
var css = require("text!ext/ftp/ftp.css");

module.exports = ext.register("ext/ftp/ftp", {
    name     : "FTP",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    markup   : markup,
    pageTitle: "Transcript",
    pageID   : "pgFtpConsole",
    hotitems : {},
    css      : css,
    nodes    : [],
    groupList : ["owner", "group", "public"],
    permissionList : ["read", "write", "execute"],
    
    hook : function(){
        ext.initExtension(this);
        
        // hack to hide the dock panel!!
        if (window.dockPanelRight)
            dockPanelRight.setAttribute("visible", false)
            
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        //trFiles.setAttribute("multiselect", false);
    },

    init : function(amlNode){
        apf.importCssString((this.css || ""));
        
        // console
        if (!this.$panel) {
            tabConsole.remove("console"); // remove Console tab
            tabConsole.remove("output"); // remove Output tab
            btnConsoleClear.hide();
            txtConsoleInput.hide();

            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.appendChild(ftpConsoleHbox);
            tabConsole.set(this.$panel);
        };
        
        // filetree contextmenu, disabled for now
        /*
        var item = new apf.item({
            id: "mnuItmFileProperties",
            caption : "File Properties",
            onclick : "require('ext/ftp/ftp').showFileProperties(trFiles.selected)"
        });
        
        mnuCtxTree.appendChild(item);
        */
    },
    
    log : function(msg, type, code){
        if (!tabConsole.visible)
            ideConsole.enable();
        
        msg = apf.htmlentities(String(msg));

        if (!type)
            type = "log";
        else if (type == "command") {
            msg = "<span style='color:#0066FF'><span style='float:left'>Cmd:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "response") {
            msg = "<span style='color:#66FF66'><span style='float:left'>" + code + ":</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "status") {
            msg = "<span style='color:#FFFFFF'><div>"
                + msg + "</div></span>"
        }
        else if (type == "error") {
            msg = "<span style='color:#FF3300'><span style='float:left'>" + code + ":</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        txtFtpConsole.addValue("<div class='item console_" + type + "'>" + msg + "</div>");
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");
        for (var i = 0, l = aLines.length; i < l; ++i)
            this.log(aLines[i], "log");
        //this.log("", "divider");
    },
    
    /**
     * Opens properties window and display properties for selected node
     */
    showFileProperties: function(node) {
//        filesystem.webdav.getProperties(node.getAttribute("path"));
        
        var permissions = "755"; // @todo, change to actual permissions of file/folder

        this.parsePermissions(permissions);
        winFileProperties.show();
    },
    
    /**
     * set permissions in model
     */
    parsePermissions: function(permissions, noUpdate) {
        var fileRights = "";
        for (var val, groupType, i = -1, l = this.groupList.length; ++i < l;) {
            groupType = this.groupList[i];
            val = parseInt(permissions[i]);
            
            for (var checked, permissionType, j = -1, jl = this.permissionList.length; ++j < jl;) {
                permissionType = this.permissionList[j];
                checked = 0;
                if (permissionType == "read" && val >= 4) {
                    checked = 1;
                    val -= 4;
                } 
                else if (permissionType == "write" && val >= 2) {
                    checked = 1;
                    val -= 2;
                }
                else if (permissionType == "execute" && val >= 1) {
                    checked = 1;
                }
                
                if (!noUpdate)
                    apf.xmldb.setAttribute(mdlFilePermissions.queryNode("group[@type=\"" + groupType + "\"]/permission[@type=\"" + permissionType + "\"]"), "checked", checked);
                
                fileRights += checked ? permissionType.charAt(0).toLowerCase() : "-";
            }
        }

        apf.xmldb.setAttribute(mdlFilePermissions.queryNode("octal"), "value", permissions);
        apf.xmldb.setAttribute(mdlFilePermissions.queryNode("rights"), "value", fileRights);
    },
    
    /**
     * get octal permissions from model
     */
    getPermissions: function() {
        var permissions = "";
        var pValues = {
            "read": 4,
            "write": 2,
            "execute": 1
        }
        for (var val, groupType, i = -1, l = this.groupList.length; ++i < l;) {
            groupType = this.groupList[i];
            val = 0;
            
            for (var node, permissionType, j = -1, jl = this.permissionList.length; ++j < jl;) {
                permissionType = this.permissionList[j];
                node = mdlFilePermissions.queryNode("group[@type=\"" + groupType + "\"]/permission[@type=\"" + permissionType + "\"]");
                if (node.getAttribute("checked") == "1")
                    val += pValues[permissionType];
            }
            permissions += val;
        }
        
        return permissions;
    },
    
    /**
     * 
     */
    updatePermissionCheckbox: function(groupType, permissionType, checked) {
        apf.xmldb.setAttribute(mdlFilePermissions.queryNode("group[@type=\"" + groupType + "\"]/permission[@type=\"" + permissionType + "\"]"), "checked", checked ? "1": "0");
        
        var permissions = this.getPermissions();
        this.parsePermissions(permissions, true);
    },
    
    /** 
     *
     */
    updatePermissionTextbox: function(permissions) {
        if (permissions.length < 3)
            return;
        for (var val, i = -1, l = permissions.length; ++i < l;) {
            val = parseInt(permissions[i]);
            if (val < 0 || val > 7)
                return;
        }
        this.parsePermissions(permissions);
    },
    
    setPermissions: function() {
        var obj = {};
        obj["http://ajax.org/2005/aml"] = {
            "permissions": "755"
        };

        filesystem.webdav.setProperties(node.getAttribute("path"), obj);
        
    },
    
    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "transcript")
            return;
        
        this.log(message.body, message.subtype, message.code);
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