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

//#ifdef __WITH_XIINCLUDE
/**
 * Defines a list of acceptable values
 */
apf.XiInclude = function(struct, tagName){
    this.$init(tagName || "include", apf.NODE_HIDDEN, struct);
};

apf.xinclude.setElement("include", apf.XiInclude);
apf.aml.setElement("include", apf.XiInclude);

(function(){
    this.$parsePrio = "002";

    //1 = force no bind rule, 2 = force bind rule
    /*this.$attrExcludePropBind = apf.extend({
        href : 1,
        src  : 1
    }, this.$attrExcludePropBind);*/

    this.$propHandlers["href"] = 
    this.$propHandlers["src"]  = function(value){
        if (typeof value != "string")
            return finish.call(this, value);

        this.$path = value.charAt(0) == "{" //@todo this shouldn't happen anymore
          ? value
          : apf.getAbsolutePath(apf.hostPath, value);
        
        var domParser = this.ownerDocument.$domParser;
        if (!this.defer) {
            domParser.$shouldWait++;
            this.$parseContext = domParser.$callCount < 2 
                && domParser.$parseContext || [this.parentNode];
        }
        
        //var basePath = apf.hostPath;//only for recursion: apf.getDirname(xmlNode.getAttribute("filename")) || 
        loadIncludeFile.call(this, this.$path);
    };
    
    function finish(xmlNode){
        var domParser = this.ownerDocument.$domParser;

        if (this.clear)
            this.parentNode.$int.innerHTML = "";
        
        //@todo apf3.x the insertBefore seems like unnecessary overhead
        if (xmlNode) {
            var nodes = domParser.parseFromXml(xmlNode, {
                    doc: this.ownerDocument
                }).firstChild.childNodes,
                pNode = this.parentNode,
                node, i, l;
            for (node, i = 0, l = nodes.length; i < l; i++) {
                (node = nodes[i]).parentNode = null; //@todo a little hackery
                pNode.insertBefore(node, this);
            }
        }

        if (!this.defer)
            domParser.$continueParsing.apply(domParser, this.$parseContext);
            
        if (this.callback) {
            this.callback({
                xmlNode : xmlNode,
                amlNode : this.parentNode
            })
        }
        
        this.parentNode.removeChild(this);
    }
    
    function loadIncludeFile(path){
        //#ifdef __DEBUG
        apf.console.info("Loading include file: " + path);
        //#endif

        var _self = this;
        apf.getData(path, apf.extend(this.options || {}, {
            callback : function(xmlString, state, extra){
                if (state != apf.SUCCESS) {
                    var oError = new Error(apf.formatErrorString(1007,
                        _self, "Loading Includes", "Could not load Include file '"
                        + (path || _self.src)
                        + "'\nReason: " + extra.message));

                    if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                        return true;

                    apf.console.error(oError.message);

                    finish.call(_self, null);

                    //throw oError;
                    return;
                }

                //@todo apf3.0 please make one way of doing this
                xmlString = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "")
                    .replace(/&nbsp;/g, " ").replace(/^[\r\n\s]*/, "");
                if (!apf.supportNamespaces)
                    xmlString = xmlString.replace(/xmlns\=\"[^"]*\"/g, "");
                
                if (xmlString.indexOf("<a:application") == -1)
                    xmlString = "<a:application xmlns:a='" + apf.ns.aml +"'>"
                      + xmlString + "</a:application>";

                var xmlNode = apf.getXml(xmlString, null, true);//apf.getAmlDocFromString(xmlString);
            
                if (!xmlNode) {
                    throw new Error(apf.formatErrorString(0, null,
                        "Loading skin",
                        "Could not parse include file. Maybe the file does not exist?", xmlNode));
                }
            
                xmlNode.setAttribute("filename", extra.url);

                // #ifdef __DEBUG
                apf.console.info("Loading of " + xmlNode[apf.TAGNAME].toLowerCase() + " include done from file: " + extra.url);
                // #endif
            
                finish.call(_self, xmlNode); //@todo add recursive includes support here
            },
            async         : true,
            ignoreOffline : true
        }));
    }
}).call(apf.XiInclude.prototype = new apf.AmlElement());
//#endif