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

// #ifdef __DOMPARSER
/**
 * The parser of the Ajax.org Markup Language. Besides aml this parser takes care
 * of distributing parsing tasks to other parsers like the native html parser and
 * the xsd parser.
 * @parser
 * @private
 *
 * @define include element that loads another aml files.
 * Example:
 * <code>
 *   <a:include src="bindings.aml" />
 * </code>
 * @attribute {String} src the location of the aml file to include in this application.
 * @addnode global, anyaml
 */
apf.DOMParser = function(){};

apf.DOMParser.prototype = new (function(){
    this.caseInsensitive    = true;
    this.preserveWhiteSpace = false; //@todo apf3.0 whitespace issue
    
    /* 
        @todo domParser needs to get a queue based on the parentNode that is 
              waiting to be parsed. This will prevent collisions when multiple
              parts of the document are altered at the same time.
    */
    this.$shouldWait = 0;

    // privates
    var RE     = [
            /\<\!(DOCTYPE|doctype)[^>]*>/,
            /&nbsp;/g,
            /<\s*\/?\s*(?:\w+:\s*)[\w-]*[\s>\/]/g
        ],
        XPATH  = "//@*[not(contains(local-name(), '.')) and not(translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = local-name())]";
    
    this.parseFromString = function(xmlStr, mimeType, options){
        var xmlNode;
        if (this.caseInsensitive) {
            //replace(/&\w+;/, ""). replace this by something else
            //.replace(RE[1], " ")
            var str = xmlStr.replace(RE[0], "")
              .replace(RE[2], //.replace(/^[\r\n\s]*/, "")
                function(m){ return m.toLowerCase(); });

            /* @todo apf3.0 integrate this
            x.ownerDocument.setProperty("SelectionNamespaces",
                                    "xmlns:a='" + apf.ns.aml + "'");
            */
        
            if (!this.supportNamespaces)
                str = str.replace(/xmlns\=\"[^"]*\"/g, "");
        
            //#ifdef __WITH_EXPLICIT_LOWERCASE
            xmlNode = apf.getXmlDom(str, null, this.preserveWhiteSpace || apf.debug).documentElement;
            var i, l,
                nodes = xmlNode.selectNodes(XPATH);
            // Case insensitive support
            for (i = 0, l = nodes.length; i < l; i++) {
                (nodes[i].ownerElement || nodes[i].selectSingleNode(".."))
                    .setAttribute(nodes[i].nodeName.toLowerCase(), nodes[i].nodeValue);
            }
            /* #else
        
            var xmlNode = apf.getXmlDom(str);
            if (apf.xmlParseError) apf.xmlParseError(xmlNode);
            xmlNode = xmlNode.documentElement;
            #endif */
        }
        else {
            xmlNode = apf.getXmlDom(xmlStr, null, this.preserveWhiteSpace || apf.debug).documentElement;
        }

        return this.parseFromXml(xmlNode, options);
    };
    
    //@todo prevent leakage by not recording .$aml
    this.parseFromXml = function(xmlNode, options){
        var doc, docFrag, amlNode, beforeNode;
        if (!options) 
            options = {};
        
        if (!options.delayedRender && !options.include) {
            //Create a new document
            if (options.doc) {
                doc     = options.doc;
                docFrag = options.docFrag || doc.createDocumentFragment();
            }
            else {
                doc            = new apf.AmlDocument();
                doc.$aml       = xmlNode;
                doc.$domParser = this;
            }
            if (options.host)
                doc.$parentNode = options.host; //This is for sub docs that need to access the outside tree
            
            // #ifdef __DEBUG
            //Check for children in Aml node
            /*if (!xmlNode.childNodes.length) {
                apf.console.warn("DOMParser got markup without any children");
                return (docFrag || doc);
            }*/
            // #endif
            
            //Let's start building our tree
            amlNode = this.$createNode(doc, xmlNode.nodeType, xmlNode); //Root node
            (docFrag || doc).appendChild(amlNode);
            if (options.htmlNode)
                amlNode.$int = options.htmlNode;
        }
        else {
            amlNode    = options.amlNode;
            doc        = options.doc;
            
            if (options.include) {
                var n = amlNode.childNodes;
                var p = n.indexOf(options.beforeNode);
                var rest = p ? n.splice(p, n.length - p) : [];
            }
        }

        //Set parse context
        this.$parseContext = [amlNode, options];

        //First pass - Node creation
        var nodes, nodelist = {}, prios = [], _self = this;
        var recur;
        (recur = function(amlNode, nodes){
            var cL, newNode, node, nNodes,
                cNodes = amlNode.childNodes,
                i      = 0,
                l      = nodes.length;
            for (; i < l; i++) {
                //Create child
                newNode = _self.$createNode(doc, (node = nodes[i]).nodeType, node);
                if (!newNode) continue; //for preserveWhiteSpace support

                cNodes[cL = cNodes.length] = newNode; //Add to children
                
                //Set tree refs
                newNode.parentNode = amlNode;
                if (cL > 0)
                    (newNode.previousSibling = cNodes[cL - 1]).nextSibling = newNode;

                //Create children
                if (!newNode.render && newNode.canHaveChildren && (nNodes = node.childNodes).length)
                    recur(newNode, nNodes);
                
                //newNode.$aml = node; //@todo should be deprecated...
                
                //Store high prio nodes for prio insertion
                if (newNode.$parsePrio) {
                    if (newNode.$parsePrio == "001") {
                        newNode.dispatchEvent("DOMNodeInsertedIntoDocument"); //{relatedParent : nodes[j].parentNode}
                        continue;
                    }
                        
                    (nodelist[newNode.$parsePrio] || (prios.push(newNode.$parsePrio) 
                      && (nodelist[newNode.$parsePrio] = []))).push(newNode); //for second pass
                }
            }

            amlNode.firstChild = cNodes[0];
            amlNode.lastChild  = cNodes[cL];
        })(amlNode, xmlNode.childNodes);
        
        if (options.include && rest.length) {
            var index = n.length - 1;
            n.push.apply(n, rest);
            var last = n[index];
            var next = n[index + 1];
            (next.previousSibling = last).nextSibling = next;
            amlNode.lastChild = n[n.length - 1];
        }

        if (options.delay) {
            amlNode.$parseOptions = {
                prios: prios,
                nodelist: nodelist
            };
            return (docFrag || doc);
        }
        
        //Second pass - Document Insert signalling
        prios.sort();
        var i, j, l, l2;
        for (i = 0, l = prios.length; i < l; i++) {
            nodes = nodelist[prios[i]];
            for (j = 0, l2 = nodes.length; j < l2; j++) {
                nodes[j].dispatchEvent("DOMNodeInsertedIntoDocument"); //{relatedParent : nodes[j].parentNode}
            }
        }

        if (this.$shouldWait)
            return (docFrag || doc);

        if (options.timeout) {
            $setTimeout(function(){
                _self.$continueParsing(amlNode, options);
            });
        }
        else {
            this.$continueParsing(amlNode, options);
        }

        return (docFrag || doc);
    };
    
    this.$callCount = 0;
    this.$continueParsing = function(amlNode, options){
        if (this.$shouldWait && --this.$shouldWait != 0)
            return false;

        if (!options)
            options = {};
            
        this.$callCount++;

        if (amlNode.$parseOptions) {
            var prios    = amlNode.$parseOptions.prios,
                nodelist = amlNode.$parseOptions.nodelist,
                i, j, l, l2, node;
            delete amlNode.$parseOptions;
            
            //Second pass - Document Insert signalling
            prios.sort();
            for (i = 0, l = prios.length; i < l; i++) {
                nodes = nodelist[prios[i]];
                for (j = 0, l2 = nodes.length; j < l2; j++) {
                    if (!(node = nodes[j]).parentNode || node.$amlLoaded) //@todo generalize this using compareDocumentPosition
                        continue;
                    nodes[j].dispatchEvent("DOMNodeInsertedIntoDocument"); //{relatedParent : nodes[j].parentNode}
                }
            }
        }

        //instead of $amlLoaded use something more generic see compareDocumentPosition
        if (!options.ignoreSelf && !amlNode.$amlLoaded)
            amlNode.dispatchEvent("DOMNodeInsertedIntoDocument"); //{relatedParent : nodes[j].parentNode}

        //Recursively signal non prio nodes
        (function _recur(nodes){
            var node, nNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!(node = nodes[i]).$parsePrio && !node.$amlLoaded) {
                    node.dispatchEvent("DOMNodeInsertedIntoDocument"); //{relatedParent : nodes[j].parentNode}
                }
                
                //Create children
                if (!node.render && (nNodes = node.childNodes).length)
                    _recur(nNodes);
            }
        })(amlNode.childNodes);
        
        if (!--this.$callCount && !options.delay)
            apf.queue.empty();
        
        if (options.callback)
            options.callback.call(amlNode.ownerDocument);

        delete this.$parseContext;
    };
    
    this.$createNode = function(doc, nodeType, xmlNode, namespaceURI, nodeName, nodeValue){
        var o;
        
        switch (nodeType) {
            case 1:
                var id, prefix;
                if (xmlNode) {
                    if ((namespaceURI = xmlNode.namespaceURI || apf.ns.xhtml) 
                      && !(prefix = doc.$prefixes[namespaceURI])) {
                        doc.$prefixes[prefix = xmlNode.prefix || xmlNode.scopeName || ""] = namespaceURI;
                        doc.$namespaceURIs[namespaceURI] = prefix;
                        
                        if (!doc.namespaceURI && !prefix) {
                            doc.namespaceURI = namespaceURI;
                            doc.prefix       = prefix;
                        }
                    }
                    nodeName = xmlNode.baseName || xmlNode.localName || xmlNode.tagName.split(":").pop();
                }
                else {
                    prefix = doc.$prefixes[namespaceURI] || "";
                }

                //#ifdef __DEBUG
                if (!namespaceURI) {
                    throw new Error("Missing namespace definition."); //@todo apf3.0 make proper error
                }
                if (!apf.namespaces[namespaceURI]) {
                    if (this.allowAnyElement)
                        namespaceURI = apf.ns.xhtml;
                    else 
                        throw new Error("Missing namespace handler for '" + namespaceURI + "'"); //@todo apf3.0 make proper error
                }
                //#endif
                
                var els = apf.namespaces[namespaceURI].elements;

                //#ifdef __DEBUG
                if (!(els[nodeName] || els["@default"])) {
                    throw new Error("Missing element constructor: " + nodeName); //@todo apf3.0 make proper error
                }
                //#endif
                
                o = new (els[nodeName] || els["@default"])(null, nodeName);
                
                o.prefix       = prefix || "";
                o.namespaceURI = namespaceURI;
                o.tagName      = prefix ? prefix + ":" + nodeName : nodeName;
        
                if (xmlNode) {
                    if (id = xmlNode.getAttribute("id"))
                        o.$propHandlers["id"].call(o, o.id = id);

                    //attributes
                    var attr = xmlNode.attributes, n;
                    for (var a, i = 0, l = attr.length; i < l; i++) {
                        o.attributes.push(new apf.AmlAttr(o, 
                            (n = (a = attr[i]).nodeName), a.nodeValue));
                        //#ifdef __WITH_DELAYEDRENDER
                        if (n == "render")
                            o.render = true;
                        //#endif
                    }
                }
                
                break;
            case 2:
                o = new apf.AmlAttr();
                o.name  = o.nodeName = nodeName;
                if (nodeValue || (nodeValue = xmlNode && xmlNode.nodeValue))
                    o.value = o.nodeValue = nodeValue;

                if (xmlNode) {
                    if (xmlNode.namespaceURI && !(o.prefix = doc.$namespaceURIs[o.namespaceURI = xmlNode.namespaceURI]))
                        doc.$prefixes[o.prefix = xmlNode.prefix || xmlNode.scopeName] = o.namespaceURI;
                }
                else {
                    o.prefix = doc.$prefixes[namespaceURI];
                }
                
                break;
            case 3:
                if (xmlNode) 
                    nodeValue = xmlNode && xmlNode.nodeValue;
                if (!this.preserveWhiteSpace && !(nodeValue || "").trim())
                    return;

                o = new apf.AmlText();
                o.nodeValue = nodeValue || xmlNode && xmlNode.nodeValue;
                break;
            case 7:
                var target = nodeName || xmlNode && xmlNode.nodeName;
                //#ifdef __DEBUG
                if(!apf.aml.processingInstructions[target])
                    throw new Error(apf.formatErrorString(0, null,
                        "The processing instruction does not exist", "Could not find the processing instruction with target: " + target));
                //#endif
                o = new apf.aml.processingInstructions[target]();

                o.target = o.nodeName  = target;
                o.data   = o.nodeValue = nodeValue || xmlNode && xmlNode.nodeValue;
                break;
            case 4:
                o = new apf.AmlCDATASection();
                o.nodeValue = nodeValue || xmlNode && xmlNode.nodeValue;
                break;
            case 5: //unsupported
                o = new apf.AmlNode();
                o.nodeType = nodeType;
                break;
            case 6: //unsupported
                o = new apf.AmlNode();
                o.nodeType = nodeType;
                break;
            case 8:
                o = new apf.AmlComment();
                o.nodeValue = nodeValue || xmlNode && xmlNode.nodeValue;
                break;
            case 9:
                o = new apf.AmlDocument();
                o.$domParser = this;
                break;
            case 10: //unsupported
                o = new apf.AmlNode();
                o.nodeType = nodeType;
                break;
            case 11:
                o = new apf.AmlDocumentFragment();
                break;
        }
        
        o.ownerDocument = doc;    
        o.$aml          = xmlNode;
        
        return o;
    };
})();

/**
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.AmlNamespace = function(){
    this.elements = {};
    this.processingInstructions = {};
};

apf.AmlNamespace.prototype = {
    setElement : function(tagName, fConstr){
        return this.elements[tagName] = fConstr;
    },
    
    setProcessingInstruction : function(target, fConstr){
        this.processingInstructions[target] = fConstr;
    }
};

//#endif
