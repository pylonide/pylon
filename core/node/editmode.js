/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

var __EDITMODE__  = 1 << 15;
var __MULTILANG__ = 1 << 16;

// #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE

jpf.KeywordServer = {
    automatch: false,
    prefix   : "sub.main.",
    words    : {},
    texts    : {},
    elements : {},
    count    : 0,
    
    setWordListXml: function(xmlNode, prefix){
        if (typeof xmlNode == "string") 
            xmlNode = jpf.getXmlDom(xmlNode).documentElement;
        this.parseSection(xmlNode, prefix);
    },
    
    parseSection: function(xmlNode, prefix){
        if (!prefix) 
            prefix = "";
        
        if (xmlNode.tagName == "key") {
            prefix += "." + xmlNode.getAttribute("id");
            this.updateWordList(prefix, xmlNode.firstChild ? xmlNode.firstChild.nodeValue : "");
            return;
        }
        
        //if(xmlNode.tagName == "lang") prefix = xmlNode.getAttribute("id");
        if (xmlNode.tagName == "group") 
            prefix += (prefix ? "." : "") + xmlNode.getAttribute("id");
        
        var nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++) 
            this.parseSection(nodes[i], prefix);
    },
    
    updateWordList: function(key, value){
        this.words[key] = value;
        if (!this.elements[key]) 
            return;
        
        for (var i = 0; i < this.elements[key].length; i++) {
            if (this.elements[key][i].htmlNode.nodeType == 1) 
                this.elements[key][i].htmlNode.innerHTML = value;
            else 
                this.elements[key][i].htmlNode.nodeValue = value;
        }
    },
    
    /* 
    #ifdef __WITH_EDITMODE
    
    getWordListXml : function(doTest){
        //var re = new RegExp("^" + this.prefix.replace(/\./g, "\\.")), 
        //    str = ["<lang id='EN'><group id='main'>"];
        var lut = {};
        for (key in this.words) {
            nKey = key.split(".");//replace(/^.*\.(.*)$/, "$1");
            if(!lut[nKey[0]])
                lut[nKey[0]] = [];
            //if (!lut[nKey[0]][nKey[1]])
            //    lut[nKey[0]][nKey[1]] = []
            //lut[nKey[0]][nKey[1]].push("<key id='", nKey[2], "'><![CDATA[", doTest ? "aaaaa" : this.words[key], "]]></key>");
            lut[nKey[0]].push("<key id='", nKey[1], "'><![CDATA[", doTest ? "aaaaa" : this.words[key], "]]></key>");
        }
        
        var str = ["<app>"];
        //for (var lang in lut) {
        str.push("<lang id='" + this.lang + "'>");
        for (var group in lut) {
            str.push("<group id='" + group + "'>");
            for(var i = 0; i < lut[group].length; i++)
                str.push(lut[group][i]);
            str.push("</group>");
        }
        str.push("</lang>");
        //}
        
        var result = str.join("") + "</app>";
        
        return result;
    },
    
    addWord : function(str, key, oEl){
        if (this.automatch && !key && this.texts[str])
            key = this.texts[str];
        if (!key)
            key = this.getNewKey();
        this.words[key] = str;
        this.texts[str] = key;
        if (!this.elements[key])
            this.elements[key] = [];
        if (oEl)
            this.elements[key].push(oEl);
        
        return key;
    },
     
    getNewKey : function(){
       var key = this.prefix + this.count++;
       while (this.words[key] !== undefined) {
           key = this.prefix + this.count++;
        }
        return key;
    },
    
    removeElement : function(key, oEl){
        if (!this.elements[key]) return;
        this.elements[key].remove(oEl);
    },
    
    #endif
    */
    addElement: function(key, oEl){
        if (!this.elements[key]) 
            this.elements[key] = [];
        return this.elements[key].push(oEl) - 1;
    },
    
    removeElement: function(key, id){
        this.elements[key].removeIndex(id);
    },
    
    getWord: function(key){
        return this.words[key];
    }
};

// #endif

/* #ifdef __WITH_EDITMODE
EditServer = {
    data : [],
    edit : null,
    
    init : function(){
        this.edit = document.createElement("dt");
        this.setStyle(0);
        this.edit.onmouseover = function(){ event.cancelBubble = true; };
        this.edit.onmouseout  = function(){ event.cancelBubble = true; };
        this.edit.onmouseup   = function(){ EditServer.startEdit(this.parentNode.editId); };
        
        this.edit.onkeydown = function(e){
            var key = (e || event).keyCode;
            
            if (key == 27)
                EditServer.stopEdit(this.parentNode.editId, true);
            else if (key == 13)
                EditServer.stopEdit(this.parentNode.editId);
        }
        
        this.edit.onblur = function(){
            EditServer.stopEdit(this.parentNode.editId);
        }
    },
    
    setStyle : function(type){
        if (type == 0) {
            this.edit.style.backgroundColor = "blue";
            this.edit.style.color    = "white";
            this.edit.style.display  = "inline";
            this.edit.style.cursor   = "hand";
            //this.edit.style.border = "1px dotted gray";
            this.edit.style.border   = "0";
            this.edit.style.padding  = "0px";
            //this.edit.style.margin = "-1px -1px -1px -1px";
            this.edit.style.margin   = "0";
        }
        else if (type == 1) {
            this.edit.style.backgroundColor = "white";
            //this.style.backgroundImage = "";
            this.edit.style.color  = "black";
            this.edit.style.cursor = "text";
            this.edit.style.border = "1px dotted gray";
            this.edit.style.margin = "-1px";
        }
    },
    
    register : function(data){
        var xmlNode = data.config 
            ? xmldb.selectSingleNode(data.config[data.counter][1], data.jmlNode) 
            : xmldb.getTextNode(data.jmlNode);
        if (!xmlNode)
            xmlNode = jpf.xmldb.createNodeFromXpath(data.jmlNode, data.config[data.counter][1]);
        var key = xmlNode.nodeValue;
        if (!key.match(/^\$.*\$$/)) {
            var key = jpf.KeywordServer.addWord(data.htmlNode.innerHTML, null, data);
            xmlNode.nodeValue = "$" + key + "$";
        }
        data.key = key;
        
        this.setEvents(data.htmlNode);
        return (data.htmlNode.editId = this.data.push(data) - 1);
    },
    
    setEvents : function(htmlNode){
        htmlNode.onselectstart = function(){event.cancelBubble=true;}
        htmlNode.onmouseover = function(){
            if (EditServer.isEditing || EditServer.edit.parentNode == this) return;
            
            if (EditServer.edit.innerHTML)
                EditServer.edit.parentNode.onmouseout({});
            
            EditServer.edit.innerHTML = this.innerHTML;
            this.innerHTML            = "";
            this.appendChild(EditServer.edit);
        }
        
        htmlNode.onmouseout = function(e){
            if (EditServer.isEditing || EditServer.edit.parentNode != this 
                || (e || event).toElement == EditServer.edit) return;
            
            this.innerHTML            = EditServer.edit.innerHTML;
            EditServer.edit.innerHTML = "";
        }
    },
    
    startEdit : function(id){
        if (this.isEditing) return;
        this.isEditing = true;
        var data       = this.data[id];
        
        EditServer.setStyle(1);
        this.edit.contentEditable = true;
        
        //var r = document.selection.createRange();
        //r.moveToElementText(this.edit);
        //r.select();
        
        this.edit.focus();
        if (data.jmlObject) {
            data.jmlObject.$KH       = data.jmlObject.keyHandler;
            data.jmlObject.keyHandler = null;
        }
    },
    
    stopEdit : function(id, isCancel){
        var data = this.data[id];
        
        EditServer.setStyle(0);
        
        this.edit.contentEditable = false;
        
        if (data.jmlObject) {
            data.jmlObject.keyHandler = data.jmlObject.$KH;
            data.jmlObject.$KH       = null;
        }
        
        if (!isCancel) {
            var word = jpf.xmldb.getTextNode(this.edit).nodeValue;
            jpf.KeywordServer.addWord(word, data.key);
            if (this.onupdateword)
                this.onupdateword(word, data.key);
        }
        else {
            this.edit.firstChild.nodeValue = jpf.KeywordServer.getWord(data.key);
        }
        
        var r = document.selection.createRange();
        try{r.moveToElementText(this.edit);}catch(e){}
        r.collapse();
        r.select();
        
        if(this.edit.parentNode)
            this.edit.parentNode.innerHTML = this.edit.innerHTML;
        this.edit.innerHTML = "";
        
        this.isEditing = false;
    }
}
EditServer.init();
function EditMode(){
    this.$regbase = this.$regbase|__EDITMODE__;
    this.$regbase = this.$regbase|__MULTILANG__;
    
    this.enableEditing = function(){
        this.editable = true;
    }
    
    this.disableEditing = function(){
        this.editable = false;
    }
    
    this.$makeEditable = function(type, htmlNode, jmlNode){
        var config = this.editableParts[type];
        for (var i = 0; i < config.length; i++) {
            var subNode = this.$getLayoutNode(type, config[i][0], htmlNode);
            if (!subNode) continue;
            
            //get ElementNode
            subNode = subNode.nodeType == 1 
                ? subNode 
                : (subNode.nodeType == 3 || subNode.nodeType == 4 
                    ? subNode.parentNode 
                    : subNode.ownerElement || subNode.selectSinglesubNode(".."));
            
            var data = {
                jmlNode  : jmlNode,
                jmlObject: this,
                htmlNode : subNode,
                type     : type,
                counter  : i,
                config   : config
            }
            
            EditServer.register(data);
        }
    }
}
//setTimeout('alert("Switch to");
//    value1 = jpf.KeywordServer.getWordListXml();
//    jpf.KeywordServer.setWordListXml(jpf.KeywordServer.getWordListXml(true), "sub");', 3000);
//setTimeout('alert("Switch back");
//    jpf.KeywordServer.setWordListXml(value1, "sub");', 6000);
#endif
*/
// #ifdef __WITH_LANG_SUPPORT && !__WITH_EDITMODE

/**
 * Baseclass adding Multilingual features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 * @todo Make this work together with appsettings.defaults and property management
 */
jpf.MultiLang = function(){
    this.$regbase = this.$regbase | __MULTILANG__;
    
    var reggedItems = [];
    this.$makeEditable = function(type, htmlNode, jmlNode){
        if (jmlNode.prefix != "j") 
            return;//using a non-xml format is unsupported

        var config = this.editableParts[type];
        for (var i = 0; i < config.length; i++) {
            var subNode = this.$getLayoutNode(type, config[i][0], htmlNode);
            if (!subNode) 
                continue;
            
            var xmlNode = config
                ? jpf.xmldb.selectSingleNode(config[i][1], jmlNode)
                : jpf.xmldb.getTextNode(jmlNode);

            if (!xmlNode) 
                continue;//xmlNode = jpf.xmldb.createNodeFromXpath(jmlNode, config[i][1]);

            var key = xmlNode.nodeValue.match(/^\$(.*)\$$/); // is this not conflicting?
            if (key) {
                subNode = subNode.nodeType == 1
                    ? subNode
                    : (subNode.nodeType == 3 || subNode.nodeType == 4
                        ? subNode.parentNode
                        : subNode); //subNode.ownerElement || subNode.selectSinglesubNode("..")
                reggedItems.push([key[1], jpf.KeywordServer.addElement(key[1], {
                    htmlNode: subNode
                })]);
            }
        }
    };
    
    this.$removeEditable = function(){
        for (var i = 0; i < reggedItems.length; i++) {
            jpf.KeywordServer.removeElement(reggedItems[i][0], reggedItems[i][1]);
        }
        
        reggedItems = [];
    };
    
    this.$jmlDestroyers.push(function(){
        this.$removeEditable();
    });
};

//setTimeout('alert("Switch");
//    jpf.KeywordServer.setWordListXml("<group id=\'main\'><key id=\'0\'>aaaaaaa</key></group>", "sub");', 1000);
// #endif
