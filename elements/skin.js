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
//#ifdef __WITH_PRESENTATION || __INC_ALL

/**
 * element specifying the skin of an application.
 * Example:
 * <code>
 *  <a:skin src="perspex.xml"
 *    name       = "perspex"
 *    media-path = "http://example.com/images"
 *    icon-path  = "http://icons.example.com" />
 * </code>
 * @attribute {String} name       the name of the skinset.
 * @attribute {String} src        the location of the skin definition.
 * @attribute {String} media-path the basepath for the images of the skin.
 * @attribute {String} icon-path  the basepath for the icons used in the elements using this skinset.
 * @allowchild  style, presentation
 * @addnode global, anyaml
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.skin = function(struct, tagName){
    this.$init(tagName || "skin", apf.NODE_HIDDEN, struct);
};
apf.aml.setElement("skin", apf.skin);

(function(){
    this.$parsePrio = "002";
    this.$includesRemaining = 0;
    
    this.$propHandlers["src"] = function(value){
        if (value.trim().charAt(0) == "<") {
            apf.skins.Init(apf.getXml(value), this, this.$path);
            return;
        }
        
        this.$path = apf.getAbsolutePath(apf.hostPath, value)
        getSkin.call(this, this.$path);
    }
    
    this.$propHandlers["name"] = function(value){
        if (!this.attributes.getNamedItem("src")) {
            this.$path = apf.getAbsolutePath(apf.hostPath, value) + "/index.xml";
            getSkin.call(this, this.$path);
        }
    }
    
    /**
     * @private
     */
    function checkForAmlNamespace(xmlNode){
        if (!xmlNode.ownerDocument.documentElement)
            return false;

        var nodes = xmlNode.ownerDocument.documentElement.attributes;
        for (var found = false, i=0; i<nodes.length; i++) {
            if (nodes[i].nodeValue == apf.ns.aml) {
                found = true;
                break;
            }
        }

        //#ifdef __DEBUG
        if (!found) {
            throw new Error(apf.formatErrorString(0, null,
                "Checking for the aml namespace",
                "The Ajax.org Platform xml namespace was not found in "
                + (xmlNode.getAttribute("filename")
                    ? "in '" + xmlNode.getAttribute("filename") + "'"
                    : "")));
        }
        //#endif;

        return found;
    }
    
    function getSkin(path){
        var domParser = this.ownerDocument.$domParser;
        
        if (!apf.skins.$first)
            apf.skins.$first = this;
        
        var defer = this.attributes.getNamedItem("defer");
        if (!defer || !apf.isTrue(defer.nodeValue)) {
            domParser.$shouldWait++;
            this.$parseContext = domParser.$parseContext || [this.ownerDocument.documentElement];
        }
        
        //var basePath = apf.hostPath;//only for recursion: apf.getDirname(xmlNode.getAttribute("filename")) || 
        loadSkinFile.call(this, path);
        
    }
    
    function finish(xmlNode){
        if (xmlNode)
            apf.skins.Init(xmlNode, this, this.$path);

        if (!this.defer) {// && this.$parseContext
            var domParser = this.ownerDocument.$domParser;
            domParser.$continueParsing.apply(domParser, this.$parseContext);
        }
    }
    
    //#ifdef __WITH_SKIN_INCLUDES
    function loadSkinInclude(includeNode, xmlNode, path) {
        var _self = this;

        //#ifdef __DEBUG
        apf.console.info("Loading include file: " + apf.getAbsolutePath(path, includeNode.getAttribute("src")));
        //#endif

        //#ifdef __WITH_DATA
        apf.getData(
        /*#else
        apf.oHttp.get(
        #endif */
          apf.getAbsolutePath(path, includeNode.getAttribute("src")), {
          callback: function(xmlString, state, extra){
            if (state != apf.SUCCESS) {
                throw new Error(apf.formatErrorString(0, _self,
                    "Loading skin includes",
                    "Could not load skin include: " + extra.url));
            }

            var newPart = apf.getXml(xmlString.substr(0, 8) == "<a:skin "
                ? xmlString
                : '<a:skin xmlns:a="http://ajax.org/2005/aml">' + xmlString + '</a:skin>');
            apf.mergeXml(newPart, xmlNode, {beforeNode: includeNode});
            includeNode.parentNode.removeChild(includeNode);
            
            var includeNodes = $xmlns(newPart, "include", apf.ns.aml);
            _self.$includesRemaining += includeNodes.length;
            if (includeNodes.length) {
                var path = apf.getDirname(extra.url);
                for (var i = 0; i < includeNodes.length; i++) {
                    loadSkinInclude.call(_self, includeNodes[i], xmlNode, path);
                }
            }
            else if (--_self.$includesRemaining == 0) {
                // #ifdef __DEBUG
                apf.console.info("Loading of " + xmlNode[apf.TAGNAME].toLowerCase() + " skin done from file: " + extra.url);
                // #endif

                finish.call(_self, xmlNode);
            }
          }
        });
    }
    //#endif
    
    function loadSkinFile(path){
        //#ifdef __DEBUG
        apf.console.info("Loading include file: " + path);
        //#endif

        var _self = this;
        //#ifdef __WITH_DATA
        apf.getData(
        /*#else
        apf.oHttp.get(
        #endif */
          path, {
          //#ifdef __DEBUG
          type : "skin",
          //#endif
          callback: function(xmlString, state, extra){
             if (state != apf.SUCCESS) {
                var oError = new Error(apf.formatErrorString(1007,
                    _self, "Loading skin file", "Could not load skin file '"
                    + (path || _self.src)
                    + "'\nReason: " + extra.message));

                if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                    return true;

                //#ifdef __WITH_SKIN_AUTOLOAD
                if (this.autoload) {
                    apf.console.warn("Could not autload skin.");
                    return finish.call(_self);
                }
                //#endif

                throw oError;
            }

            //if (!apf.supportNamespaces)
            xmlString = xmlString.replace(/\<\!DOCTYPE[^>]*>/, "")
                .replace(/^[\r\n\s]*/, "") //.replace(/&nbsp;/g, " ")
                .replace(/xmlns\=\"[^"]*\"/g, "");
            
            if (!xmlString) {
                throw new Error(apf.formatErrorString(0, _self,
                    "Loading skin",
                    "Empty skin file. Maybe the file does not exist?", _self));
            }
            
            var xmlNode = apf.getXml(xmlString);//apf.getAmlDocFromString(xmlString);
            
            // #ifdef __DEBUG
            checkForAmlNamespace(xmlNode);
            // #endif
            
            if (!xmlNode) {
                throw new Error(apf.formatErrorString(0, _self,
                    "Loading skin",
                    "Could not parse skin. Maybe the file does not exist?", _self));
            }
            
            xmlNode.setAttribute("filename", extra.url);
            
            //#ifdef __WITH_SKIN_INCLUDES
            var includeNodes = $xmlns(xmlNode, "include", apf.ns.aml);
            _self.$includesRemaining += includeNodes.length;
            if (includeNodes.length) {
                var path = apf.getDirname(extra.url);
                for (var i = 0; i < includeNodes.length; i++) {
                    loadSkinInclude.call(_self, includeNodes[i], xmlNode, path);
                }
                return;
            }
            else 
            //#endif
            {
                // #ifdef __DEBUG
                apf.console.info("Loading of " + xmlNode[apf.TAGNAME].toLowerCase() + " skin done from file: " + extra.url);
                // #endif
                
                finish.call(_self, xmlNode);
            }
          }, 
          async         : true,
          ignoreOffline : true
        });
    }
    
    //@todo use mutation events to update
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.src || this.name)
            return;
        
        apf.skins.Init(this.$aml || this);
        
        //@todo implied skin
        /*if (this.parentNode && this.parentNode.parentNode) {
            var name = "skin" + Math.round(Math.random() * 100000);
            q.parentNode.setAttribute("skin", name);
            apf.skins.skins[name] = {name: name, templates: {}};
            apf.skins.skins[name].templates[q.parentNode[apf.TAGNAME]] = q;
        }*/
    });
}).call(apf.skin.prototype = new apf.AmlElement());

// #endif