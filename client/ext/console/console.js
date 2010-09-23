/**
 * Console for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/console/console",
    ["core/ide", "core/ext", "ext/panels/panels", "text!ext/console/console.xml"], 
    function(ide, ext, panels, markup) {

return ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,

    clear : function() {
        txtConsole.clear();
    },

    logNodeStream : function(data, stream) {
        var colors = {
            30: "black",
            31: "red",
            32: "green",
            33: "yellow",
            34: "blue",
            35: "magenta",
            36: "cyan",
            37: "white"
        };

        var lines = data.split("\n");
        var style = "color:black;";
        var log = [];

        for (var i=0; i<lines.length; i++) {
            if (!lines[i]) continue;
            
            log.push("<div><span style='" + style + "'>" + lines[i]
                .replace(/\s/g, "&nbsp;")
                .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                    style = "color:" + (colors[color] || "black");
                    if (extra == 1) {
                        style += ";font-weight=bold"
                    } else if (extra == 4) {
                        style += ";text-decoration=underline";
                    }
                    return "</span><span style='" + style + "'>"
                }) + "</span></div>");
        }
        txtConsole.addValue(log.join(""));
    },
    
    evaluate : function(expression){
        try {
            var obj = self.parent.eval('0,' + this.value);
        }catch(e){
            obj = e.message;
        }
        require('ext/console/console').showObject(obj, null, this.value);
    },
    
    checkChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
            return false;
    },
    
    applyChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        var name = this.calcName(xmlNode);
        try{
            if (name.indexOf(".") > -1) {
                var prop, obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
                if (obj && obj.$supportedProperties && obj.$supportedProperties.contains(prop = RegExp.$1)) {
                    obj.setProperty(prop, self.parent.eval(value));
                    return;
                }
            }
            
            self.parent.eval(name + " = " + value);
            
            //@todo determine new type
        }
        catch(e) {
            trObject.getActionTracker().undo();
            alert("Invalid Action: " + e.message);
            //@todo undo
        }
    },
    
    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay 
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name") 
                : loopNode.getAttribute("name");
            
            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);
        
        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },
    
    consoleTextHandler: function(e) {
        if (e.keyCode == 9 && e.currentTarget == txtCode) {
            txtCode.focus();
            e.cancelBubble = true;
            return false;
        }
        else if(e.keyCode == 13 && e.ctrlKey) {
            apf.$debugwin.jRunCode(txtCode.value, codetype.value, txtModel.value);
            return false;
        }
    },
    
    /*showObject : function(obj, id, name){
        tabDebug.set(1);
        pgBrowse.set(2);

        if (!name && obj && obj.$regbase) {
            name = obj.getAttribute("id") || "Aml Node";
            id   = this.apf.$debugwin.cache.push(obj) - 1;
        }

        txtCurObject.setValue(name);
        trObject.clear("loading");

        var _self = this;
        setTimeout(function(){
            if (!id && id !== 0)
                $apf_ide_mdlObject.load(_self.analyze(obj, name, name));
            else
                $apf_ide_mdlObject.load(_self.analyze(_self.apf.$debugwin.cache[id], 
                    "apf.$debugwin.cache[" + id + "]", name));
        }, 10);
    },
    
    types : ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"],
    domtypes : [null, "Element", "Attr", "Text", "CDataSection", 
                "EntityReference", "Entity", "ProcessingInstruction", "Comment", 
                "Document", "DocumentType", "DocumentFragment", "Notation"],
    
    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay 
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name") 
                : loopNode.getAttribute("name");
            
            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);
        
        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },*/
    
    /**** Init ****/

    hook : function(){
        panels.register(this);
    },

    init : function(amlNode){
        this.panel = winDbgConsole;
        
        lstScripts.addEventListener("afterselect", function(e) {
            e.selected && _self.$showFile(e.selected.getAttribute("scriptid"));
        });
        
        apf.importCssString(".console_date{display:inline}");
    },

    enable : function(fromParent){
        if (!this.panel)
            panels.initPanel(this);

        //@todo stupid hack, find out why its not below editors
        
        //Append the console window at the bottom below the tab
        ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[2]").appendChild(winDbgConsole);

        if (this.manual && fromParent)
            return;
        
        if (!fromParent)
            this.manual = true;
        
        this.mnuItem.check();
        winDbgConsole.show();
    },

    disable : function(fromParent){
        if (this.manual && fromParent)
            return;

        if (!fromParent)
            this.manual = true;

        this.mnuItem.uncheck();
        winDbgConsole.hide();
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
        panels.unregister(this);
    }
});

});